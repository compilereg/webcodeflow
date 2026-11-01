/*This handles:

request null
contest null
contest stopped
empty problem name
empty language name
empty file name
empty file content
problem not found
language not found*/






package utilities;

import Model.SubmissionFileRequest;
import Model.SubmitRunRequest;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IContestClock;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class SubmitRunValidator {

    private SubmitRunValidator() {
    }

    public static SubmitRunValidationResult validate(IContest contest, SubmitRunRequest request) {
        SubmitRunValidationResult result = new SubmitRunValidationResult();

        if (request == null) {
            result.addError("Request body is missing or invalid.");
            return result;
        }

        if (contest == null) {
            result.addError("Unable to retrieve contest data.");
            return result;
        }

        IContestClock contestClock = contest.getContestClock();
        if (contestClock == null || !contestClock.isContestClockRunning()) {
            result.addError("Submissions cannot be made while the contest is stopped or paused.");
        }

        String problemName = safeTrim(request.getProblemName());
        String languageName = safeTrim(request.getLanguageName());

        if (problemName.isEmpty()) {
            result.addError("Problem name cannot be empty.");
        }

        if (languageName.isEmpty()) {
            result.addError("Language name cannot be empty.");
        }

        SubmissionFileRequest mainFile = request.getMainFile();
        if (mainFile == null) {
            result.addError("Main file is required.");
        } else {
            if (safeTrim(mainFile.getFileName()).isEmpty()) {
                result.addError("Main file name cannot be empty.");
            }
            if (safeTrim(mainFile.getFileContentBase64()).isEmpty()) {
                result.addError("Main file content cannot be empty.");
            }
        }

        List<SubmissionFileRequest> additionalFiles = request.getAdditionalFiles();
        if (additionalFiles != null) {
            Set<String> seenNames = new HashSet<>();

            if (mainFile != null && !safeTrim(mainFile.getFileName()).isEmpty()) {
                seenNames.add(safeTrim(mainFile.getFileName()).toLowerCase());
            }

            for (int i = 0; i < additionalFiles.size(); i++) {
                SubmissionFileRequest file = additionalFiles.get(i);

                if (file == null) {
                    result.addError("Additional file at index " + i + " is invalid.");
                    continue;
                }

                String fileName = safeTrim(file.getFileName());
                String fileContent = safeTrim(file.getFileContentBase64());

                if (fileName.isEmpty()) {
                    result.addError("Additional file at index " + i + " has empty file name.");
                }

                if (fileContent.isEmpty()) {
                    result.addError("Additional file '" + fileName + "' has empty content.");
                }

                if (!fileName.isEmpty()) {
                    String lowerName = fileName.toLowerCase();
                    if (seenNames.contains(lowerName)) {
                        result.addError("Duplicate file name detected: " + fileName);
                    } else {
                        seenNames.add(lowerName);
                    }
                }
            }
        }

        if (!problemName.isEmpty()) {
            IProblem problem = ProblemResolver.findProblem(contest, problemName);
            if (problem == null) {
                result.addError("Problem '" + problemName + "' not found.");
            } else {
                result.setProblem(problem);
            }
        }

        if (!languageName.isEmpty()) {
            ILanguage language = LanguageResolver.findLanguage(contest, languageName);
            if (language == null) {
                result.addError("Language '" + languageName + "' not found.");
            } else {
                result.setLanguage(language);
            }
        }

        return result;
    }

    private static String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}