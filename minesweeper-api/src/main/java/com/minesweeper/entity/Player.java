package com.minesweeper.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "player")
public class Player {

    @Id
    @Column(name = "id_player")
    private String id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;

    @Column(name = "date_last_connexion", nullable = false)
    private LocalDateTime dateLastConnexion;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDateTime getDateLastConnexion() {
        return dateLastConnexion;
    }

    public void setDateLastConnexion(LocalDateTime dateLastConnexion) {
        this.dateLastConnexion = dateLastConnexion;
    }
}

