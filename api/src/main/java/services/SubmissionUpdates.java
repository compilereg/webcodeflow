package services;

import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.IRun;
import edu.csus.ecs.pc2.api.implementation.Contest;
import edu.csus.ecs.pc2.api.listener.IRunEventListener;
import websocket.ContestSocket;

public class SubmissionUpdates implements IRunEventListener {

    private final Contest teamContest;
    private final String jwt;
    private final String teamLoginName;

    public SubmissionUpdates(
        Contest teamContest,
        String jwt,
        String teamLoginName
    ) {
        if (teamContest == null) {
            throw new IllegalArgumentException(
                "teamContest must not be null"
            );
        }

        if (jwt == null || jwt.trim().isEmpty()) {
            throw new IllegalArgumentException(
                "jwt must not be null or empty"
            );
        }

        this.teamContest = teamContest;
        this.jwt = jwt;
        this.teamLoginName = teamLoginName;
    }

    @Override
    public void runSubmitted(IRun run) {
        /*
         * Do not update the scoreboard for an unjudged submission.
         *
         * Submitting a file does not change solved count, penalty,
         * or rank.
         */
    }

    @Override
    public void runJudged(
        IRun run,
        boolean isFinal
    ) {
        if (run == null) {
            return;
        }

        if (!isOwnedRun(run)) {
            return;
        }

        if (
            !run.isFinalJudged()
                && !run.isPreliminaryJudged()
        ) {
            return;
        }

        pushJudgedRun(
            run,
            "RUN_JUDGED",
            isFinal
        );
    }

    @Override
    public void runUpdated(
        IRun run,
        boolean isFinal
    ) {
        /*
         * runUpdated may occur during rejudging or an administrative
         * update. Ignore it until the run contains a judgement.
         */
        if (run == null) {
            return;
        }

        if (!isOwnedRun(run)) {
            return;
        }

        if (
            !run.isFinalJudged()
                && !run.isPreliminaryJudged()
                && !run.isDeleted()
        ) {
            return;
        }

        pushJudgedRun(
            run,
            "RUN_UPDATED",
            isFinal
        );

        
    }

    @Override
    public void runDeleted(IRun run) {
        if (run == null) {
            return;
        }

        if (!isOwnedRun(run)) {
            return;
        }

        /*
         * Do not require finalJudged here. PC2 may clear judgement
         * information as part of deletion.
         */
        pushJudgedRun(
            run,
            "RUN_DELETED",
            false
        );

    }

    @Override
    public void runCheckedOut(
        IRun run,
        boolean isFinal
    ) {
        // Not required by the frontend.
    }

    @Override
    public void runCompiling(
        IRun run,
        boolean isFinal
    ) {
        // Not required by the frontend.
    }

    @Override
    public void runExecuting(
        IRun run,
        boolean isFinal
    ) {
        // Not required by the frontend.
    }

    @Override
    public void runValidating(
        IRun run,
        boolean isFinal
    ) {
        // Not required by the frontend.
    }

    @Override
    public void runJudgingCanceled(
        IRun run,
        boolean isFinal
    ) {
        // Add an event only if the frontend handles this state.
    }

    private void pushJudgedRun(
        IRun run,
        String type,
        boolean isFinalEvent
    ) {
        try {
            IProblem problem =
                run.getProblem();

            ILanguage language =
                run.getLanguage();

            String problemName =
                problem != null
                    ? problem.getName()
                    : "";

            String languageName =
                language != null
                    ? language.getName()
                    : "";

            String judgement =
                run.getJudgementName() != null
                    ? run.getJudgementName()
                    : "";

            int siteNumber =
                run.getSiteNumber();

            int runNumber =
                run.getNumber();

            boolean finalJudged =
                run.isFinalJudged();

            boolean preliminaryJudged =
                run.isPreliminaryJudged();

            boolean solved =
                run.isSolved();

            boolean deleted =
                run.isDeleted();

            String json =
                "{"
                    + "\"type\":\""
                    + escapeJson(type)
                    + "\","
                    + "\"payload\":{"
                    + "\"siteNumber\":"
                    + siteNumber
                    + ","
                    + "\"runNumber\":"
                    + runNumber
                    + ","
                    + "\"problem\":\""
                    + escapeJson(problemName)
                    + "\","
                    + "\"language\":\""
                    + escapeJson(languageName)
                    + "\","
                    + "\"judgement\":\""
                    + escapeJson(judgement)
                    + "\","
                    + "\"finalEvent\":"
                    + isFinalEvent
                    + ","
                    + "\"finalJudged\":"
                    + finalJudged
                    + ","
                    + "\"preliminaryJudged\":"
                    + preliminaryJudged
                    + ","
                    + "\"solved\":"
                    + solved
                    + ","
                    + "\"deleted\":"
                    + deleted
                    + "}"
                    + "}";

            ContestSocket.sendToToken(jwt, json);

            System.out.println(
                "[PC2] Submission result cached and WebSocket sent: "
                    + type
                    + " site="
                    + siteNumber
                    + " run="
                    + runNumber
                    + " judgement="
                    + judgement
            );
        } catch (Exception exception) {
            System.err.println(
                "[PC2] Failed to send submission update"
                    + " jwt="
                    + jwt
            );

            exception.printStackTrace();
        }
    }

    private boolean isOwnedRun(IRun run) {
        return run.getTeam() != null
            && run.getTeam().getLoginName() != null
            && teamLoginName != null
            && run.getTeam().getLoginName().equalsIgnoreCase(teamLoginName);
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