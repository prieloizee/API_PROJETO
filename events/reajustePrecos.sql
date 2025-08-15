create event if not exists reajuste_Precos_eventos_proximos
    on schedule every 1 day
    starts current_timestamp + interval 2 minute
    on completion preserve 
do 
    update ingresso set preco = preco * 1.10
    where fk_id_evento in(
        select id_evento from evento
        where data_hora between now() and now() + interval 7 day
    );

    -- teste

    insert into evento (id_evento, nome, descricao, data_hora, local, fk_id_organizador) values
(2001, 'Evento Antigo', 'teste teste', now() - interval 2 year, 'Franca-SP', 1);

INSERT INTO ingresso (id_ingresso, preco, tipo, fk_id_evento)
VALUES (4001, 100.00, 'pista', 2001);