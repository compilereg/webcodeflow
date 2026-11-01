package web1;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Properties;

public class ServerINI {

    private static ServerINI init = null;

    private int portNum;
    private static String socketPath;
    private String allowedOrigin;
    private String scoreboardAccount;
    private String scoreboardPassword;

    private ServerINI() {
        readINI();
    }

    public static synchronized ServerINI createServerINI() {
        if (init == null) {
            init = new ServerINI();
        }

        return init;
    }

    public int getPortNum() {
        return portNum;
    }

    public static String getSocketPath() {
        return socketPath;
    }

    public String getAllowedOrigin() {
        return allowedOrigin;
    }

    public String getScoreboardAccount() {
        return scoreboardAccount;
    }

    public String getScoreboardPassword() {
        return scoreboardPassword;
    }

    public void readINI() {
        Properties properties = new Properties();

        try (
            FileInputStream inputStream =
                new FileInputStream("pc2v9.ini")
        ) {
            properties.load(inputStream);

            String configuredPort =
                properties.getProperty("wwfAPIPort");

            if (
                configuredPort == null
                    || configuredPort.trim().isEmpty()
            ) {
                portNum = 8080;
            } else {
                portNum =
                    Integer.parseInt(
                        configuredPort.trim()
                    );
            }

            socketPath =
                properties.getProperty(
                    "wwfWSPath",
                    "/ws/contest"
                );

            if (
                socketPath == null
                    || socketPath.trim().isEmpty()
            ) {
                socketPath = "/ws/contest";
            } else {
                socketPath = socketPath.trim();

                if (!socketPath.startsWith("/")) {
                    socketPath = "/" + socketPath;
                }
            }

            allowedOrigin =
                properties.getProperty(
                    "wwfWSAllowedOrigin",
                    "http://wwffrontend.aast.edu"
                );

            if (
                allowedOrigin == null
                    || allowedOrigin.trim().isEmpty()
            ) {
                allowedOrigin =
                    "http://wwffrontend.aast.edu";
            } else {
                allowedOrigin =
                    allowedOrigin.trim();
            }

            scoreboardAccount =
                properties.getProperty(
                    "wwfScoreboardAccount",
                    "scoreboard2"
                );

            if (
                scoreboardAccount == null
                    || scoreboardAccount.trim().isEmpty()
            ) {
                scoreboardAccount = "scoreboard2";
            } else {
                scoreboardAccount =
                    scoreboardAccount.trim();
            }

            scoreboardPassword =
                properties.getProperty(
                    "wwfScoreboardPassword",
                    "scoreboard2"
                );

            if (
                scoreboardPassword == null
                    || scoreboardPassword.trim().isEmpty()
            ) {
                scoreboardPassword = "scoreboard2";
            } else {
                scoreboardPassword =
                    scoreboardPassword.trim();
            }

            System.out.println(
                "From readINI"
                    + " port="
                    + portNum
                    + " socketPath="
                    + socketPath
                    + " allowedOrigin="
                    + allowedOrigin
                    + " scoreboardAccount="
                    + scoreboardAccount
            );
        } catch (FileNotFoundException exception) {
            System.err.println(
                "pc2v9.ini was not found. Using default configuration."
            );

            setDefaults();
        } catch (NumberFormatException exception) {
            System.err.println(
                "Invalid wwfAPIPort value. Using default configuration."
            );

            setDefaults();
        } catch (IOException exception) {
            System.err.println(
                "Failed to read pc2v9.ini. Using default configuration."
            );

            setDefaults();
        }
    }

    private void setDefaults() {
        portNum = 8080;
        socketPath = "/ws/contest";
        allowedOrigin =
            "http://wwffrontend.aast.edu";
        scoreboardAccount = "scoreboard2";
        scoreboardPassword = "scoreboard2";
    }
}