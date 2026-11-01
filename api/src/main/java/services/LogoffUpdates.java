package services;

import controllers.maincontroller;
import edu.csus.ecs.pc2.api.implementation.Contest;
import edu.csus.ecs.pc2.api.listener.IConnectionEventListener;
import websocket.ContestSocket;

public class LogoffUpdates implements IConnectionEventListener {

    private final Contest teamContest;
    private final String jwt;

    public LogoffUpdates(Contest teamContest, String jwt) {
        this.teamContest = teamContest;
        this.jwt = jwt;
    }

    @Override
    public void connectionDropped() {
        forceLogout("PC2_CONNECTION_DROPPED");
    }

    private void forceLogout(String reason) {
        maincontroller.sessions.remove(jwt);

        String json =
            "{"
                + "\"type\":\"LOGOUT_REQUIRED\","
                + "\"payload\":{"
                + "\"reason\":\"" + escapeJson(reason) + "\","
                + "\"message\":\"Your PC2 session was terminated by the administrator.\""
                + "}"
                + "}";

        ContestSocket.forceLogoutToken(jwt, json);

        System.out.println(
            "[PC2] Connection dropped. Forced logout sent. JWT=" + jwt
        );
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r");
    }
}