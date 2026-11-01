package web1;

public class starterclass {
    public static ServerINI ini;

    public static void main(String[] args) {
        ini = ServerINI.createServerINI();
        System.out.println(">>> test compo Configuration Loaded: Port is  Successfully in port :" + ini.getPortNum());
        helpers.CorsConfig.addAllowedOrigin("http://localhost:" + ini.getPortNum());
        helpers.CorsConfig.addAllowedOrigin("http://localhost:8888");
        helpers.CorsConfig.addAllowedOrigin(ini.getAllowedOrigin());
        webServer ws = new webServer(ini.getPortNum(), ini.getSocketPath());
        ws.start();
    }
}