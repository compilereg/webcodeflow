package helpers;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class XssSanitizerTest {

    @Test
    public void testSanitize_NullInput() {
        assertNull(XssSanitizer.sanitize(null), "Null input should return null");
    }

    @Test
    public void testSanitize_NormalString() {
        String input = "HelloWorld123";
        assertEquals(input, XssSanitizer.sanitize(input), "Normal string should be unchanged");
    }

    @Test
    public void testSanitize_XSSScriptTag() {
        String input = "<script>alert('xss')</script>";
        String expected = "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;";
        assertEquals(expected, XssSanitizer.sanitize(input), "Script tags should be neutralized");
    }

    @Test
    public void testSanitize_XSSEventHandler() {
        String input = "\" onload=\"alert('xss')";
        String expected = "&quot; onload=&quot;alert(&#x27;xss&#x27;)";
        assertEquals(expected, XssSanitizer.sanitize(input), "Event handler injection should be neutralized");
    }

    @Test
    public void testSanitize_Ampersand() {
        String input = "Tom & Jerry";
        String expected = "Tom &amp; Jerry";
        assertEquals(expected, XssSanitizer.sanitize(input), "Ampersands should be escaped");
    }
}
