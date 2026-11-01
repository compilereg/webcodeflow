package helpers;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class JWTOpsTest {

    private static final String VALID_KEY = "D0ntEverL0gHereAgainDudeInAnyACPCContest";
    private static final String WRONG_KEY = "D0ntEverL0gHereAgainDudeInAnyACPCContestWrong";

    @Test
    public void testCreateAndVerifyJWTSuccess() {
        String token = JWTOps.createJWT(
                "subject123",
                "acpc",
                "team",
                "team12",
                "Team 12",
                30,
                VALID_KEY
        );

        assertNotNull(token);
        assertFalse(token.isEmpty());

        Claims claims = JWTOps.verifyJWT(token, VALID_KEY);
        assertNotNull(claims);
        assertEquals("subject123", claims.getSubject());
        assertEquals("acpc", claims.getIssuer());
        assertEquals("team", claims.get("rol"));
        assertEquals("team12", claims.get("log"));
        assertEquals("Team 12", claims.get("dis"));
    }

    @Test
    public void testVerifyExpiredJWT() {
        // Expiration is negative minutes to simulate expired token
        String token = JWTOps.createJWT(
                "subject123",
                "acpc",
                "team",
                "team12",
                "Team 12",
                -5,
                VALID_KEY
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            JWTOps.verifyJWT(token, VALID_KEY);
        });
        assertTrue(ex.getMessage().contains("JWT expired"), "Expected JWT expired exception but got: " + ex.getMessage());
    }

    @Test
    public void testVerifyMalformedJWT() {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            JWTOps.verifyJWT("not.a.valid.jwt", VALID_KEY);
        });
        assertTrue(ex.getMessage().contains("Malformed JWT"), "Expected Malformed JWT but got: " + ex.getMessage());
    }

    @Test
    public void testVerifyInvalidSignatureJWT() {
        String token = JWTOps.createJWT(
                "subject123",
                "acpc",
                "team",
                "team12",
                "Team 12",
                30,
                VALID_KEY
        );

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            JWTOps.verifyJWT(token, WRONG_KEY);
        });
        assertTrue(ex.getMessage().contains("Invalid signature"), "Expected Invalid signature but got: " + ex.getMessage());
    }

    @Test
    public void testVerifyEmptyJWT() {
        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            JWTOps.verifyJWT("", VALID_KEY);
        });
        assertTrue(ex.getMessage().contains("JWT string is empty"), "Expected empty string exception but got: " + ex.getMessage());
    }
}
