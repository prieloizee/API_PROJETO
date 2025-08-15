create table resumo_evento (
    id_evento int auto_increment primary key,
    total_ingressos int not null default 0,
    FOREIGN KEY (id_evento) REFERENCES evento(id_evento)
);