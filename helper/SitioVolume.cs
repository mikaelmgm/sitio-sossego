// Sítio Sossego — ajudante de volume.
// Programinha sem janela que escuta SÓ em 127.0.0.1:38917 e deixa o wallpaper ler/mudar o volume do Windows.
// Exige um token aleatório (gravado em token.js ao lado deste exe) em toda chamada.
using System;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
    int RegisterControlChangeNotify(IntPtr p);
    int UnregisterControlChangeNotify(IntPtr p);
    int GetChannelCount(out uint count);
    int SetMasterVolumeLevel(float db, ref Guid ctx);
    int SetMasterVolumeLevelScalar(float level, ref Guid ctx);
    int GetMasterVolumeLevel(out float db);
    int GetMasterVolumeLevelScalar(out float level);
    int SetChannelVolumeLevel(uint ch, float db, ref Guid ctx);
    int SetChannelVolumeLevelScalar(uint ch, float level, ref Guid ctx);
    int GetChannelVolumeLevel(uint ch, out float db);
    int GetChannelVolumeLevelScalar(uint ch, out float level);
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, ref Guid ctx);
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorCom { }

static class Program {
    const int Port = 38917;
    static string token = "";

    static IAudioEndpointVolume Endpoint() {
        // pega o dispositivo padrão a cada chamada: funciona mesmo se você trocar de fone/caixa
        IMMDeviceEnumerator en = (IMMDeviceEnumerator)(new MMDeviceEnumeratorCom());
        IMMDevice dev;
        Marshal.ThrowExceptionForHR(en.GetDefaultAudioEndpoint(0, 1, out dev));
        Guid iid = typeof(IAudioEndpointVolume).GUID;
        object o;
        Marshal.ThrowExceptionForHR(dev.Activate(ref iid, 23, IntPtr.Zero, out o));
        return (IAudioEndpointVolume)o;
    }

    static string State() {
        IAudioEndpointVolume v = Endpoint();
        float level; bool mute;
        v.GetMasterVolumeLevelScalar(out level); v.GetMute(out mute);
        return "{\"level\":" + level.ToString("0.###", CultureInfo.InvariantCulture) + ",\"muted\":" + (mute ? "true" : "false") + "}";
    }

    static string Query(string url, string key) {
        int q = url.IndexOf('?'); if (q < 0) return null;
        foreach (string part in url.Substring(q + 1).Split('&')) {
            int eq = part.IndexOf('=');
            if (eq > 0 && part.Substring(0, eq) == key) return Uri.UnescapeDataString(part.Substring(eq + 1));
        }
        return null;
    }

    static void Handle(TcpClient client) {
        using (client) {
            client.ReceiveTimeout = 2000; client.SendTimeout = 2000;
            NetworkStream s = client.GetStream();
            byte[] buf = new byte[4096]; int n = 0;
            while (n < buf.Length) {
                int r = s.Read(buf, n, buf.Length - n); if (r <= 0) break; n += r;
                if (Encoding.ASCII.GetString(buf, 0, n).Contains("\r\n\r\n")) break;
            }
            string[] first = Encoding.ASCII.GetString(buf, 0, n).Split('\n')[0].Trim().Split(' ');
            string method = first.Length > 0 ? first[0] : "", url = first.Length > 1 ? first[1] : "/";
            string path = url.Split('?')[0], body = "{\"error\":\"not found\"}"; int code = 404;
            bool quit = false;
            if (method == "OPTIONS") { code = 204; body = ""; }
            else if (method != "GET") { code = 405; body = "{\"error\":\"method\"}"; }
            else if (Query(url, "t") != token) { code = 403; body = "{\"error\":\"token\"}"; }
            else {
                try {
                    if (path == "/get") { body = State(); code = 200; }
                    else if (path == "/set") {
                        float v;
                        if (float.TryParse(Query(url, "v"), NumberStyles.Float, CultureInfo.InvariantCulture, out v)) {
                            v = Math.Max(0f, Math.Min(1f, v));
                            IAudioEndpointVolume ep = Endpoint(); Guid ctx = Guid.Empty;
                            ep.SetMasterVolumeLevelScalar(v, ref ctx);
                            bool mute; ep.GetMute(out mute);
                            if (mute && v > 0f) ep.SetMute(false, ref ctx);
                            body = State(); code = 200;
                        } else { code = 400; body = "{\"error\":\"v\"}"; }
                    }
                    else if (path == "/quit") { body = "{\"bye\":true}"; code = 200; quit = true; }
                } catch (Exception e) { code = 500; body = "{\"error\":\"" + e.GetType().Name + "\"}"; }
            }
            byte[] payload = Encoding.UTF8.GetBytes(body);
            string head = "HTTP/1.1 " + code + " OK\r\nContent-Type: application/json\r\nContent-Length: " + payload.Length +
                "\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Private-Network: true\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n";
            byte[] hb = Encoding.ASCII.GetBytes(head);
            s.Write(hb, 0, hb.Length); s.Write(payload, 0, payload.Length); s.Flush();
            if (quit) Environment.Exit(0);
        }
    }

    [STAThread]
    static void Main() {
        bool fresh; Mutex one = new Mutex(true, "SitioSossegoVolume", out fresh);
        if (!fresh) return;                                   // já está rodando
        string dir = AppDomain.CurrentDomain.BaseDirectory, file = Path.Combine(dir, "token.js");
        if (File.Exists(file)) {
            string t = File.ReadAllText(file); int a = t.IndexOf('"'), b = t.LastIndexOf('"');
            if (a >= 0 && b > a) token = t.Substring(a + 1, b - a - 1);
        }
        if (token.Length < 16) {
            byte[] rnd = new byte[16]; using (RandomNumberGenerator g = RandomNumberGenerator.Create()) g.GetBytes(rnd);
            token = BitConverter.ToString(rnd).Replace("-", "").ToLowerInvariant();
            File.WriteAllText(file, "window.SITIO_TOKEN=\"" + token + "\";\r\n");
        }
        TcpListener server = new TcpListener(IPAddress.Loopback, Port);
        server.Start();
        while (true) {
            TcpClient c = server.AcceptTcpClient();
            ThreadPool.QueueUserWorkItem(delegate { try { Handle(c); } catch (Exception) { } });
        }
    }
}
