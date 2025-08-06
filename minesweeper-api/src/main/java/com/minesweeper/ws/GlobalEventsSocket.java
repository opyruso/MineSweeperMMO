package com.minesweeper.ws;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/global")
@ApplicationScoped
public class GlobalEventsSocket {

    private static final Set<Session> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());

    @OnOpen
    void onOpen(Session session) {
        sessions.add(session);
    }

    @OnClose
    void onClose(Session session) {
        sessions.remove(session);
    }

    public void broadcast(String message) {
        for (Session s : sessions) {
            s.getAsyncRemote().sendText(message);
        }
    }
}
