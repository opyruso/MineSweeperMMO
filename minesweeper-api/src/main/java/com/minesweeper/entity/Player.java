package com.minesweeper.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "players")
public class Player extends PanacheEntityBase {

    @Id
    @Column(name = "id_player")
    public String idPlayer;

    @Column(unique = true)
    public String name;

    @Column(name = "last_connection")
    public LocalDateTime lastConnection;
}
