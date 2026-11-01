package services;

import edu.csus.ecs.pc2.api.IClarification;
import edu.csus.ecs.pc2.api.IClarificationEventListener;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.implementation.Contest;
import websocket.ContestSocket;

public class ClarificationUpdates implements IClarificationEventListener {

    private Contest teamContest;
    private String JWT;
    private String teamLoginName;

    public ClarificationUpdates(
        Contest teamContest,
        String JWT,
        String teamLoginName
    ) {
        this.teamContest = teamContest;
        this.JWT = JWT;
        this.teamLoginName = teamLoginName;
    }

    @Override
    public void clarificationAdded(IClarification clar) {
        //System.out.println("[PC2] NEW clarification arrived!");
      //  pushClarification(clar, "CLARIFICATION_SUBMITTED");
        System.out.println("[PC2] Clarification submitted - ignored for WebSocket.");

    }

    @Override
    public void clarificationAnswered(IClarification clar) {
        String askingTeam = clar.getTeam() != null ? clar.getTeam().getLoginName() : "null";
        System.out.println("[PC2-DEBUG] clarificationAnswered fired on teamLoginName="
            + teamLoginName + ", clar.getTeam()=" + askingTeam);
        pushClarification(clar, "CLARIFICATION_ANSWERED");
    }

    @Override
    public void clarificationUpdated(IClarification clar) {
        System.out.println("[PC2] Clarification UPDATED!");
        pushClarification(clar, "CLARIFICATION_UPDATED");
    }

    @Override
    public void clarificationRemoved(IClarification clar) {
        System.out.println("[PC2] Clarification removed.");
        // nothing to broadcast
    }


    private void pushClarification(IClarification clar, String type) {
        try {
            if (clar == null) return;

            // clar.getTeam() is the ORIGINAL ASKING team, not the recipient.
            // PC2 already scopes delivery of this event correctly (verified via
            // [PC2-DEBUG] logging: fires once per connected team, including
            // teams that did not ask). Do NOT filter by clar.getTeam() here —
            // that previously discarded "Send to ALL teams" broadcasts for
            // every team except the asker.

            IProblem problem   = clar.getProblem();
            String problemName = (problem != null) ? problem.getName() : "General";
            String question    = clar.getQuestion();
            String answer      = clar.getAnswer();
            boolean answered   = (answer != null && !answer.isEmpty());
            boolean broadcast  = clar.isSendToAll();
            String askingTeam  =
                clar.getTeam() != null ? clar.getTeam().getLoginName() : "";

            String json =
                "{"
                    + "\"type\":\"" + type + "\","
                    + "\"payload\":{"
                    + "\"clarificationId\":" + clar.getNumber() + ","
                    + "\"clarificationTime\":" + clar.getSubmissionTime() + ","
                    + "\"teamname\":\"" + escapeJson(askingTeam) + "\","
                    + "\"problem\":\"" + escapeJson(problemName) + "\","
                    + "\"question\":\"" + escapeJson(question) + "\","
                    + "\"answered\":" + answered + ","
                    + "\"broadcast\":" + broadcast + ","
                    + "\"answer\":\"" + escapeJson(answered ? answer : "") + "\""
                    + "}"
                    + "}";

            ContestSocket.sendToToken(JWT, json);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r");
    }
}
