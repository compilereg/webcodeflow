package websocket;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.Cookie;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.*;

import controllers.maincontroller;
import exceptions.NotVerifiedCookieException;
import exceptions.UnauthorizedSessionException;
import helpers.CorsConfig;
import helpers.CookiesHandlers;
import services.ConfigurationUpdates;
import java.net.InetSocketAddress;
import java.util.Deque;
import java.util.ArrayDeque;
import java.util.ArrayList;

@WebSocket
public class ContestSocket {

    private static final Map<Session, String> connections = new ConcurrentHashMap<>();

 // Track connection attempts per IP
    private static final Map<String, Deque<Long>> connectionAttempts = new ConcurrentHashMap<>();

    // Track messages per session
    private static final Map<Session, Deque<Long>> messageAttempts = new ConcurrentHashMap<>();

    //private static final int MAX_CONNECTIONS_PER_MIN = 5;
   // private static final int MAX_MESSAGES_PER_MIN = 30;
    private static final int MAX_CONNECTIONS_PER_MIN = Integer.MAX_VALUE;
    private static final int MAX_MESSAGES_PER_MIN = Integer.MAX_VALUE;
    private static final long WINDOW_MS = 60_000;
    
   //helper methods
    //Rate limiting method for limiting number off sockets user can open 
    private boolean isRateLimited(Map<?, Deque<Long>> mapObj, Object key, int limit) {
        @SuppressWarnings("unchecked")
        Map<Object, Deque<Long>> map = (Map<Object, Deque<Long>>) mapObj;

        long now = System.currentTimeMillis();

        map.putIfAbsent(key, new ArrayDeque<>());
        Deque<Long> q = map.get(key);

        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_MS) {
                q.pollFirst();
            }

            if (q.size() >= limit) {
                return true;
            }

            q.addLast(now);
            return false;
        }
    }

    private String getClientIp(Session session) {
        InetSocketAddress addr = session.getRemoteAddress();
        return addr != null ? addr.getAddress().getHostAddress() : "unknown";
    }

    @OnWebSocketConnect
    public void onConnect(Session session) {
    	String ip = getClientIp(session);
    	System.out.println("[WS] onConnect called");
    	/*if (isRateLimited(connectionAttempts, ip, MAX_CONNECTIONS_PER_MIN)) {
    	    reject(session, 1008, "Too many connection attempts");
    	    return;
    	}*/

        try {
            System.out.println("[WS] Connection attempt");

            String token = extractToken(session);
            

            if (token == null || token.trim().isEmpty()) {
                throw new UnauthorizedSessionException("Missing authentication token");
            }

            CookiesHandlers.verifyCookie(token);

            if (!maincontroller.sessions.containsKey(token)) {
                throw new UnauthorizedSessionException("Session not found or expired");
            }

            validateOrigin(session);
            System.out.println("[WS] Token validated. Storing connection.");
          
            connections.put(session, token);
            System.out.println("[WS] Stored. Total connections = " + connections.size());

         //   session.setIdleTimeout(60L * 60L * 1000L);//timeout after authentication after certain period of time 

            session.getRemote().sendString(
                "{\"type\":\"WS_CONNECTED\",\"message\":\"connected\"}"
            );

            System.out.println("[WS] Connection accepted");
            
            System.out.println("Stored WS token=" + token);

        } 
        catch (UnauthorizedSessionException e) {
            reject(session, 1008, "Unauthorized....");
            
        } 
        catch (NotVerifiedCookieException e) {
            reject(session, 1008, "Invalid token");
            
        } 
        catch (Exception e) {
            e.printStackTrace();
            reject(session, 1011, "Server error");
          
        }
    }
    
    //Method to limit number of messages from user to prevent spamming 
    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
    	
    	/*if (isRateLimited(messageAttempts, session, MAX_MESSAGES_PER_MIN)) {
    	    reject(session, 1008, "Too many messages");
    	    return;
    	}*/

        System.out.println("[WS] Message received");

        if (message != null && message.contains("JOIN")) {
            ConfigurationUpdates.pushRealPc2Trigger("INITIAL_SYNC");
        }
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        connections.remove(session);//remove the session 
        messageAttempts.remove(session); // clean up rate limit map to prevent memory leak
        System.out.println("[WS] Connection closed: " + reason);
    }

   /* public static void broadcast(String message) {

        for (Session session : connections.keySet()) {
            try {
                if (session != null && session.isOpen()) {
                    session.getRemote().sendStringByFuture(message);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }*/
    
    public static void broadcast(String message) {
        for (Map.Entry<Session, String> entry : connections.entrySet()) {
            Session session = entry.getKey();

            if (session == null) continue;

            if (!session.isOpen()) {
                connections.remove(session);
                messageAttempts.remove(session);
                continue;
            }

            try {
                session.getRemote().sendStringByFuture(message);
            } catch (Exception e) {
                System.err.println("[WS] Broadcast failed: " + e.getMessage());
                connections.remove(session);
                messageAttempts.remove(session);
                closeQuietly(session);
            }
        }
    }

    /**
     * Sends a team-private event only to sockets authenticated with the
     * supplied session token.
     */
    public static void sendToToken(String token, String message) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }

        for (Map.Entry<Session, String> entry : connections.entrySet()) {
            if (!token.equals(entry.getValue())) {
                continue;
            }

            Session session = entry.getKey();
            if (session == null || !session.isOpen()) {
                connections.remove(session);
                messageAttempts.remove(session);
                continue;
            }

            try {
                session.getRemote().sendStringByFuture(message);
            } catch (Exception e) {
                System.err.println("[WS] Private send failed: " + e.getMessage());
                connections.remove(session);
                messageAttempts.remove(session);
                closeQuietly(session);
            }
        }
    }

    private static void closeQuietly(Session session) {
        try {
            if (session.isOpen()) {
                session.close(1011, "Broadcast failure");
            }
        } catch (Exception ignored) {}
    }
    
    
    
    public static void forceLogoutToken(String token, String message) {

        if (token == null || token.trim().isEmpty()) {
            return;
        }

        for (Map.Entry<Session, String> entry : new ArrayList<>(connections.entrySet())) {

            Session session = entry.getKey();
            String storedToken = entry.getValue();

            if (!token.equals(storedToken)) {
                continue;
            }

            try {
                if (session != null && session.isOpen()) {
                    session.getRemote().sendStringByFuture(message);
                    session.close(4001, "PC2 admin forced logout");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            connections.remove(session);
            messageAttempts.remove(session);
        }
    }
    
    
    
    //Disconnect Token when Logout api is called for disconnecting session
    public static void disconnectToken(String token) {

        System.out.println("[WS] disconnectToken called for token: " + token);
        System.out.println("[WS] Active connectionss: " + connections.size());

        for (Map.Entry<Session, String> entry : new java.util.ArrayList<>(connections.entrySet())) {

            Session session = entry.getKey();
            String storedToken = entry.getValue();

            System.out.println("[WS] Checking token: " + storedToken);

            if (token != null && token.equals(storedToken)) {

                try {
                    System.out.println("[WS] Match found. Closing session.");

                    if (session != null && session.isOpen()) {
                        session.close(1000, "Logged out");
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }

                connections.remove(session);
            }
        }

        System.out.println("[WS] Remaining connections: " + connections.size());
    }

    private String extractToken(Session session) {

        try {
            Cookie[] cookies = convertCookies(session);

            return CookiesHandlers.getCookie(
                cookies,
                CookiesHandlers.AUTH_COOKIE_NAME
            );

        } catch (Exception e) {
            return null;
        }
        
        
    }

    private Cookie[] convertCookies(Session session) {

        return session.getUpgradeRequest()
            .getCookies()
            .stream()
            .map(c -> new Cookie(c.getName(), c.getValue()))
            .toArray(Cookie[]::new);
    }
    
    private void validateOrigin(Session session) {
        String origin = session.getUpgradeRequest().getHeader("Origin");

        if (origin == null || !CorsConfig.isOriginAllowed(origin)) {
            throw new UnauthorizedSessionException("Invalid origin");
        }
    }

    private void reject(Session session, int code, String reason) {

        try {
            System.out.println("[WS] Rejected: " + reason);
            session.close(code, reason);
        } catch (Exception ignored) {}
    }

    public static int getConnectedClientsCount() {
        return connections.size();
    }
    
}
