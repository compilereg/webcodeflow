package utilities;

import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IProblem;

public final class ProblemResolver {

    private ProblemResolver() {
        // Utility class
    }

    public static IProblem findProblem(IContest contest, String problemName) {
        if (contest == null || problemName == null || problemName.trim().isEmpty()) {
            return null;
        }

        String normalizedName = problemName.trim();

        IProblem[] problems = contest.getProblems();
        if (problems == null) {
            return null;
        }

        for (IProblem problem : problems) {
            if (problem != null
                    && problem.getName() != null
                    && problem.getName().trim().equalsIgnoreCase(normalizedName)) {
                return problem;
            }
        }

        return null;
    }

    public static IProblem findClarificationCategoryOrProblem(IContest contest, String problemName) {
        if (contest == null || problemName == null || problemName.trim().isEmpty()) {
            return null;
        }

        String normalizedName = problemName.trim();

        IProblem problem = findProblem(contest, normalizedName);
        if (problem != null) {
            return problem;
        }

        IProblem[] categories = contest.getClarificationCategories();
        if (categories == null) {
            return null;
        }

        for (IProblem category : categories) {
            if (category != null
                    && category.getName() != null
                    && category.getName().trim().equalsIgnoreCase(normalizedName)) {
                return category;
            }
        }

        return null;
    }
}