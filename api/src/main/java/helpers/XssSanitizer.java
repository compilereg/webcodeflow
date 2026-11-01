package helpers;

/**
 * Utility class to prevent Cross-Site Scripting (XSS) vulnerabilities
 * by escaping or removing malicious HTML/JavaScript from input strings.
 */
public class XssSanitizer {

    /**
     * Sanitizes a given string to prevent XSS attacks.
     * Replaces common HTML/XML characters with their corresponding entities.
     * 
     * @param input the raw input string
     * @return the sanitized string safe for rendering or logging
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        
        StringBuilder sanitized = new StringBuilder(input.length());
        
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '<':
                    sanitized.append("&lt;");
                    break;
                case '>':
                    sanitized.append("&gt;");
                    break;
                case '&':
                    sanitized.append("&amp;");
                    break;
                case '"':
                    sanitized.append("&quot;");
                    break;
                case '\'':
                    sanitized.append("&#x27;");
                    break;
                case '/':
                    sanitized.append("&#x2F;");
                    break;
                default:
                    sanitized.append(c);
                    break;
            }
        }
        return sanitized.toString();
    }
}
