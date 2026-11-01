package utilities;

import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.ILanguage;

public final class LanguageResolver {

    private LanguageResolver() {
        // Utility class
    }

    public static ILanguage findLanguage(IContest contest, String languageName) {
        if (contest == null || languageName == null || languageName.trim().isEmpty()) {
            return null;
        }

        String normalizedName = languageName.trim();

        ILanguage[] languages = contest.getLanguages();
        if (languages == null) {
            return null;
        }

        for (ILanguage language : languages) {
            if (language != null
                    && language.getName() != null
                    && language.getName().trim().equalsIgnoreCase(normalizedName)) {
                return language;
            }
        }

        return null;
    }
}