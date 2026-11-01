package controllers;

import edu.csus.ecs.pc2.api.implementation.Contest;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

public class GlobalClassTest {

    @Test
    public void testRegistAllServices() {
        Contest mockContest = mock(Contest.class);
        GlobalClass gc = new GlobalClass();
        gc.registAllServices(mockContest, "dummyJWT", "team_test");

        // Verify that listeners are added to the PC2 Contest instance
        verify(mockContest).addContestConfigurationUpdateListener(any());
        verify(mockContest).addClarificationListener(any());
        verify(mockContest).addRunListener(any());
        verify(mockContest).addConnectionListener(any());
    }
}
