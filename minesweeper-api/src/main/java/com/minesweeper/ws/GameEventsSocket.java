package com.minesweeper.ws;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/game/{gameId}")
@ApplicationScoped
public class GameEventsSocket {

    private static final Map<String, Set<Session>> sessions = new ConcurrentHashMap<>();

    @OnOpen
    void onOpen(Session session, @PathParam("gameId") String gameId) {
        sessions.computeIfAbsent(gameId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()))
                .add(session);
    }

    @OnClose
    void onClose(Session session, @PathParam("gameId") String gameId) {
        Set<Session> set = sessions.get(gameId);
        if (set != null) {
            set.remove(session);
        }
    }

    public void broadcast(String gameId, String message) {
        Set<Session> set = sessions.get(gameId);
        if (set != null) {
            for (Session s : set) {
                s.getAsyncRemote().sendText(message);
            }
        }
    }
}
