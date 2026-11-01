package utilities;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IProblem;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ProblemResolverTest {

    @Test
    public void testFindProblemNullContest() {
        assertNull(ProblemResolver.findProblem(null, "Problem A"));
    }

    @Test
    public void testFindProblemNullOrEmptyName() {
        IContest mockContest = mock(IContest.class);
        assertNull(ProblemResolver.findProblem(mockContest, null));
        assertNull(ProblemResolver.findProblem(mockContest, ""));
        assertNull(ProblemResolver.findProblem(mockContest, "   "));
    }

    @Test
    public void testFindProblemNullProblemsArray() {
        IContest mockContest = mock(IContest.class);
        when(mockContest.getProblems()).thenReturn(null);
        assertNull(ProblemResolver.findProblem(mockContest, "Problem A"));
    }

    @Test
    public void testFindProblemSuccess() {
        IContest mockContest = mock(IContest.class);
        IProblem prob1 = mock(IProblem.class);
        when(prob1.getName()).thenReturn("Problem A");

        IProblem prob2 = mock(IProblem.class);
        when(prob2.getName()).thenReturn("Problem B");

        when(mockContest.getProblems()).thenReturn(new IProblem[]{prob1, prob2});

        // Test normal match
        IProblem result = ProblemResolver.findProblem(mockContest, "Problem A");
        assertNotNull(result);
        assertEquals("Problem A", result.getName());

        // Test trimmed, case-insensitive match
        IProblem result2 = ProblemResolver.findProblem(mockContest, "  problem b   ");
        assertNotNull(result2);
        assertEquals("Problem B", result2.getName());

        // Test no match
        IProblem resultNoMatch = ProblemResolver.findProblem(mockContest, "Problem C");
        assertNull(resultNoMatch);
    }

    @Test
    public void testFindClarificationCategoryOrProblemSuccess() {
        IContest mockContest = mock(IContest.class);
        
        IProblem prob = mock(IProblem.class);
        when(prob.getName()).thenReturn("Problem A");

        IProblem category = mock(IProblem.class);
        when(category.getName()).thenReturn("General Category");

        when(mockContest.getProblems()).thenReturn(new IProblem[]{prob});
        when(mockContest.getClarificationCategories()).thenReturn(new IProblem[]{category});

        // Find by problem name
        IProblem resultProb = ProblemResolver.findClarificationCategoryOrProblem(mockContest, "Problem A");
        assertNotNull(resultProb);
        assertEquals("Problem A", resultProb.getName());

        // Find by category name
        IProblem resultCategory = ProblemResolver.findClarificationCategoryOrProblem(mockContest, "  general category  ");
        assertNotNull(resultCategory);
        assertEquals("General Category", resultCategory.getName());

        // Null checks
        assertNull(ProblemResolver.findClarificationCategoryOrProblem(null, "Problem A"));
        assertNull(ProblemResolver.findClarificationCategoryOrProblem(mockContest, ""));
    }
}
