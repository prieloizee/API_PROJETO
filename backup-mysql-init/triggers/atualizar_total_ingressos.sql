DELIMITER //

CREATE TRIGGER atualizar_total_ingressos
AFTER INSERT ON ingresso_compra
FOR EACH ROW
BEGIN
  DECLARE v_id_evento INT;

  -- Busca o ID do evento com base no ingresso comprado
  SELECT fk_id_evento INTO v_id_evento
  FROM ingresso
  WHERE id_ingresso = NEW.fk_id_ingresso;

  -- Verifica se o evento já existe na tabela resumo_evento
  IF EXISTS (
    SELECT 1 FROM resumo_evento WHERE id_evento = v_id_evento
  ) THEN
    -- Se já existe, atualiza a quantidade
    UPDATE resumo_evento
    SET total_ingressos = total_ingressos + NEW.quantidade
    WHERE id_evento = v_id_evento;
  ELSE
    -- Caso contrário, insere um novo registro
    INSERT INTO resumo_evento (id_evento, total_ingressos)
    VALUES (v_id_evento, NEW.quantidade);
  END IF;
END; //

DELIMITER ;


-- teste

insert into ingresso_compra(fk_id_compra, fk_id_ingresso, quantidade) values
    (10, 6, 3);

select * from resumo_evento;

SELECT fk_id_evento FROM ingresso WHERE id_ingresso = 8;

SELECT * FROM resumo_evento WHERE id_evento = 5;

insert into compra (data_compra, fk_id_usuario) values
    ("2025-06-28 10:20", 2);

insert into evento (nome, data_hora, local, descricao, fk_id_organizador) values
    ('Festival da Maria', '2025-06-26', 'Praia de Santos', 'Evento de ferias', '4');

insert into evento (nome, data_hora, local, descricao, fk_id_organizador) values
    ('Festival', '2025-08-26', 'Festa', 'Evento', '5');

insert into evento (nome, data_hora, local, descricao, fk_id_organizador) values
    ('Aniversario', '2025-07-26', 'Salao', 'Ferias', '2');

    insert into ingresso (preco, tipo, fk_id_evento) values
    (800, 'vip', '5');

    insert into ingresso (preco, tipo, fk_id_evento) values
    (900, 'vip', '6');

    insert into ingresso (preco, tipo, fk_id_evento) values
    (650, 'vip', '7');

    CALL registrar_compra(2, 10, 3);
