package com.pos.dt2x.plugins;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

/**
 * 簡易 TCP 列印 Plugin
 * 直接把 EZPL 字串送到印表機 IP:9100
 */
@CapacitorPlugin(name = "TcpPrinter")
public class TcpPrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        String ip = call.getString("ip", "192.168.1.100");
        int port = call.getInt("port", 9100);
        String data = call.getString("data", "");

        if (data == null || data.isEmpty()) {
            call.reject("沒有要列印的資料");
            return;
        }

        // 在背景執行緒執行網路連線
        new Thread(() -> {
            Socket socket = null;
            try {
                socket = new Socket();
                socket.connect(new InetSocketAddress(ip, port), 5000); // 5 秒 timeout
                OutputStream out = socket.getOutputStream();
                out.write(data.getBytes(StandardCharsets.UTF_8));
                out.flush();
                out.close();
                socket.close();

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("列印失敗: " + e.getMessage());
            } finally {
                if (socket != null) {
                    try { socket.close(); } catch (Exception ignored) {}
                }
            }
        }).start();
    }
}
