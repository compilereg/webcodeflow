package web1;

import org.eclipse.jetty.server.Handler;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class Web1Test {

    @Test
    public void testStarterclassInstantiation() {
        starterclass sc = new starterclass();
        assertNotNull(sc);
    }

    @Test
    public void testWebServerConstructors() {
        webServer wsDefault = new webServer();
        assertNotNull(wsDefault);

        webServer wsPort = new webServer(9090);
        assertNotNull(wsPort);
    }

    @Test
    public void testWebServerHandlers() {
        webServer ws = new webServer();

        Handler apiHandler = ws.getApiServletHandler();
        assertNotNull(apiHandler, "API servlet handler should not be null");

        Handler swaggerHandler = ws.getSwaggerUIHandler();
        assertNotNull(swaggerHandler, "Swagger UI handler should not be null");

        Handler frontendHandler = ws.getFrontendHandler();
        assertNotNull(frontendHandler, "Frontend handler should not be null");
    }
}
