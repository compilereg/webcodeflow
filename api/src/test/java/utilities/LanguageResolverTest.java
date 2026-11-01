package utilities;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.ILanguage;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class LanguageResolverTest {

    @Test
    public void testFindLanguageNullContest() {
        assertNull(LanguageResolver.findLanguage(null, "Java"));
    }

    @Test
    public void testFindLanguageNullOrEmptyName() {
        IContest mockContest = mock(IContest.class);
        assertNull(LanguageResolver.findLanguage(mockContest, null));
        assertNull(LanguageResolver.findLanguage(mockContest, ""));
        assertNull(LanguageResolver.findLanguage(mockContest, "   "));
    }

    @Test
    public void testFindLanguageNullLanguagesArray() {
        IContest mockContest = mock(IContest.class);
        when(mockContest.getLanguages()).thenReturn(null);
        assertNull(LanguageResolver.findLanguage(mockContest, "Java"));
    }

    @Test
    public void testFindLanguageSuccess() {
        IContest mockContest = mock(IContest.class);
        ILanguage lang1 = mock(ILanguage.class);
        when(lang1.getName()).thenReturn("Java");

        ILanguage lang2 = mock(ILanguage.class);
        when(lang2.getName()).thenReturn("Python");

        when(mockContest.getLanguages()).thenReturn(new ILanguage[]{lang1, lang2});

        // Test normal match
        ILanguage result = LanguageResolver.findLanguage(mockContest, "Java");
        assertNotNull(result);
        assertEquals("Java", result.getName());

        // Test trimmed, case-insensitive match
        ILanguage result2 = LanguageResolver.findLanguage(mockContest, "  python   ");
        assertNotNull(result2);
        assertEquals("Python", result2.getName());

        // Test no match
        ILanguage resultNoMatch = LanguageResolver.findLanguage(mockContest, "C++");
        assertNull(resultNoMatch);
    }
}
