create table historico_compra (
    id_historico int auto_increment primary key,
    id_compra int not null,
    data_compra datetime not null,
    id_usuario int not null,
    data_exclusao datetime default current_timestamp
);