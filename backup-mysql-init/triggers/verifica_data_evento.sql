delimiter //

create trigger verifica_data_evento
before insert on ingresso_compra
for each row
begin
    declare data_evento datetime;

 -- buscar data do evento
    select e.data_hora into data_evento
    from ingresso i 
    join evento e 
    on i.fk_id_evento = e.id_evento
    where i.id_ingresso = new.fk_id_ingresso;

    -- Verificar se o evento já ocorreu
    if date(data_evento) < curdate() then
      signal sqlstate '45000'
      set message_text = 'Não é possível compra ingressos para eventos passados.';
    end if;
end;//

delimiter ;

insert into evento (nome, data_hora, local, descricao, fk_id_organizador)
values ('Feira Cultural de Inverno', '2025-07-20 18:00:00', 'Parque Municipal', 'Evento cultural com música e gastronomia.', 1);

insert into ingresso (preco, tipo, fk_id_evento)
values
(120.00, 'vip', 4),
(60.00, 'pista', 4);