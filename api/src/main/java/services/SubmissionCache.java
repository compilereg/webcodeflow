/*package services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class SubmissionCache {

    private static final Map<String, SubmissionEntry> CACHE = new ConcurrentHashMap<>();

    private SubmissionCache() {
    }

    public static void store(
        int siteNumber,
        int runNumber,
        String problem,
        String language,
        String judgement,
        boolean finalJudged,
        boolean preliminaryJudged,
        boolean solved,
        boolean deleted
    ) {
        CACHE.put(
            buildKey(siteNumber, runNumber),
            new SubmissionEntry(
                siteNumber,
                runNumber,
                problem,
                language,
                judgement,
                finalJudged,
                preliminaryJudged,
                solved,
                deleted
            )
        );
    }

    public static List<SubmissionEntry> getAll() {
        List<SubmissionEntry> submissions = new ArrayList<>(CACHE.values());

        submissions.sort(
            Comparator
                .comparingInt((SubmissionEntry entry) -> entry.siteNumber)
                .thenComparingInt(entry -> entry.runNumber)
        );

        return submissions;
    }

    public static void clear() {
        CACHE.clear();
    }

    private static String buildKey(int siteNumber, int runNumber) {
        return siteNumber + ":" + runNumber;
    }

    public static final class SubmissionEntry {
        public final int siteNumber;
        public final int runNumber;
        public final String problem;
        public final String language;
        public final String judgement;
        public final boolean finalJudged;
        public final boolean preliminaryJudged;
        public final boolean solved;
        public final boolean deleted;

        public SubmissionEntry(
            int siteNumber,
            int runNumber,
            String problem,
            String language,
            String judgement,
            boolean finalJudged,
            boolean preliminaryJudged,
            boolean solved,
            boolean deleted
        ) {
            this.siteNumber = siteNumber;
            this.runNumber = runNumber;
            this.problem = problem;
            this.language = language;
            this.judgement = judgement;
            this.finalJudged = finalJudged;
            this.preliminaryJudged = preliminaryJudged;
            this.solved = solved;
            this.deleted = deleted;
        }
    }
}*/