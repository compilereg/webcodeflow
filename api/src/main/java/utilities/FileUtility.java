package utilities;

import Model.SubmissionFileRequest;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class FileUtility {

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>();

    static {
        ALLOWED_EXTENSIONS.add("c");
        ALLOWED_EXTENSIONS.add("cpp");
        ALLOWED_EXTENSIONS.add("java");
        ALLOWED_EXTENSIONS.add("py");
    }

    private FileUtility() {
        // Utility class
    }

    public static MultiFileDecodeResult decodeSubmissionFiles(
            SubmissionFileRequest mainFile,
            List<SubmissionFileRequest> additionalFiles
    ) {
        MultiFileDecodeResult result = new MultiFileDecodeResult();
        Set<String> seenNames = new HashSet<>();

        if (mainFile == null) {
            result.addError("Main file is required.");
            return result;
        }

        FileDecodeResult mainResult = decodeAndCreateTempFile(
                mainFile.getFileName(),
                mainFile.getFileContentBase64()
        );

        if (mainResult.hasErrors()) {
        	System.out.println("Errors in mainResult");
            for (String error : mainResult.getErrors()) {
            	System.out.println("Errorrrsssssssss : " + error);
                result.addError("Main file: " + error);
            }
            return result;
        }

        result.setMainTempFile(mainResult.getTempFile());
        result.setMainOriginalFileName(mainResult.getOriginalFileName());
        result.setMainFileBytes(mainResult.getFileBytes());

        seenNames.add(mainResult.getOriginalFileName().toLowerCase());

        if (additionalFiles == null) {
            return result;
        }

        for (int i = 0; i < additionalFiles.size(); i++) {
            SubmissionFileRequest additionalFile = additionalFiles.get(i);

            if (additionalFile == null) {
                result.addError("Additional file at index " + i + " is invalid.");
                continue;
            }

            FileDecodeResult additionalResult = decodeAndCreateTempFile(
                    additionalFile.getFileName(),
                    additionalFile.getFileContentBase64()
            );

            if (additionalResult.hasErrors()) {
                for (String error : additionalResult.getErrors()) {
                    result.addError("Additional file [" + i + "]: " + error);
                }
                continue;
            }

            String lowerName = additionalResult.getOriginalFileName().toLowerCase();
            if (seenNames.contains(lowerName)) {
                result.addError("Duplicate file name detected: " + additionalResult.getOriginalFileName());
                continue;
            }

            seenNames.add(lowerName);
            result.getAdditionalTempFiles().add(additionalResult.getTempFile());
            result.getAdditionalOriginalFileNames().add(additionalResult.getOriginalFileName());
        }

        return result;
    }

    public static void cleanupSubmissionFiles(MultiFileDecodeResult result) {
        if (result == null) {
            return;
        }

        deleteQuietly(result.getMainTempFile());

        for (File file : result.getAdditionalTempFiles()) {
            deleteQuietly(file);
        }
    }

    private static void deleteQuietly(File file) {
        if (file != null && file.exists() && !file.delete()) {
            file.deleteOnExit();
        }
    }

    private static void validateSourceByExtension(FileDecodeResult result, String fileName, String sourceText) {
        if (fileName == null || sourceText == null || result.hasErrors()) {
            return;
        }

        String lowerFileName = fileName.toLowerCase();

        if (lowerFileName.endsWith(".py")) {
            validatePythonSource(result, sourceText);
        }
    }

    private static void validatePythonSource(FileDecodeResult result, String sourceText) {

        for (int i = 0; i < sourceText.length(); i++) {
            char ch = sourceText.charAt(i);

            boolean allowed =
                    Character.isLetterOrDigit(ch)
                            || Character.isWhitespace(ch)
                            || "_()[]{}:.,+-=*/<>!&|^~#'\"\\;@%?".indexOf(ch) >= 0;

           /* if (!allowed) {
                result.addError("Python source contains unsupported character: '" + ch + "'");
                return;
            }*/
        }

        int parenBalance = 0;
        int bracketBalance = 0;
        int braceBalance = 0;

        for (int i = 0; i < sourceText.length(); i++) {
            char ch = sourceText.charAt(i);

            if (ch == '(') {
                parenBalance++;
            } else if (ch == ')') {
                parenBalance--;
            } else if (ch == '[') {
                bracketBalance++;
            } else if (ch == ']') {
                bracketBalance--;
            } else if (ch == '{') {
                braceBalance++;
            } else if (ch == '}') {
                braceBalance--;
            }

            if (parenBalance < 0 || bracketBalance < 0 || braceBalance < 0) {
                result.addError("Python source contains unbalanced brackets.");
                return;
            }
        }

        if (parenBalance != 0 || bracketBalance != 0 || braceBalance != 0) {
            result.addError("Python source contains unbalanced brackets.");
            return;
        }

        String trimmed = sourceText.trim();
        if (trimmed.isEmpty()) {
            result.addError("Decoded source file is empty.");
            return;
        }

        char lastChar = trimmed.charAt(trimmed.length() - 1);
        if ("+-*/%<>&|^~=:,.;@([".indexOf(lastChar) >= 0) {
            result.addError("Python source ends with an invalid trailing operator or symbol.");
        }
    }

    public static FileDecodeResult decodeAndCreateTempFile(String fileName, String fileContentBase64) {
        FileDecodeResult result = new FileDecodeResult();

        String normalizedFileName = safeTrim(fileName);
        String normalizedBase64 = safeTrim(fileContentBase64);

        if (normalizedFileName.isEmpty()) {
            result.addError("File name cannot be empty.");
        }

        if (normalizedBase64.isEmpty()) {
            result.addError("File content cannot be empty.");
        }

        if (!normalizedFileName.isEmpty() && !hasValidExtension(normalizedFileName)) {
            result.addError("File extension is not supported. Allowed: .c, .cpp, .java, .py");
        }

        byte[] fileBytes = null;

        if (!normalizedBase64.isEmpty()) {
        	try {
                fileBytes = Base64.getDecoder().decode(normalizedBase64);

                String canonicalBase64 = Base64.getEncoder().encodeToString(fileBytes);
                if (!canonicalBase64.equals(normalizedBase64)) {
                    result.addError("fileContentBase64 is not in valid canonical Base64 form.");
                }
            } catch (IllegalArgumentException e) {
                result.addError("fileContentBase64 is not valid Base64.");
            }
        }

        if (fileBytes != null && fileBytes.length == 0) {
            result.addError("Uploaded file is empty.");
        }
        
        if (fileBytes != null && fileBytes.length > 0) {
            try {
                helpers.MalwareScanner.scanFile(normalizedFileName, fileBytes);
            } catch (SecurityException se) {
                result.addError("Security scan failed: " + se.getMessage());
            }
        }

        
        String sourceText = null;

        if (fileBytes != null && fileBytes.length > 0) {
            CharsetDecoder decoder = StandardCharsets.UTF_8
                    .newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT);
            try {
                sourceText = decoder.decode(ByteBuffer.wrap(fileBytes)).toString();
            } catch (CharacterCodingException e) {
                result.addError("Decoded file content is not valid UTF-8 text.");
            }
        }
       
        
        if (sourceText != null && sourceText.trim().isEmpty()) {
            result.addError("Decoded source file is empty.");
        }
        

        if (sourceText != null) {
            for (int i = 0; i < sourceText.length(); i++) {
                char ch = sourceText.charAt(i);

                boolean allowedWhitespace = ch == '\n' || ch == '\r' || ch == '\t';
                boolean disallowedControl = Character.isISOControl(ch) && !allowedWhitespace;

                if (disallowedControl) {
                    result.addError("Decoded source file contains invalid control characters.");
                    break;
                }
            }
        }

        if (sourceText != null && !result.hasErrors()) {
            validateSourceByExtension(result, normalizedFileName, sourceText);
        }
        

        if (result.hasErrors()) {
            return result;
        }

        File tempFile;
        try {
            tempFile = File.createTempFile("submit_", "_" + new File(normalizedFileName).getName());
            tempFile.deleteOnExit();

            try (FileOutputStream out = new FileOutputStream(tempFile)) {
                out.write(fileBytes);
                out.flush();
            }
        } catch (IOException e) {
            result.addError("Failed to create temporary file for submission.");
            return result;
        }

        result.setOriginalFileName(normalizedFileName);
        result.setFileBytes(fileBytes);
        result.setSourceText(sourceText);
        result.setTempFile(tempFile);

        return result;
    }

    private static boolean hasValidExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex <= 0 || lastDotIndex == fileName.length() - 1) {
            return false;
        }

        String extension = fileName.substring(lastDotIndex + 1).toLowerCase();
        return ALLOWED_EXTENSIONS.contains(extension);
    }

    private static String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}