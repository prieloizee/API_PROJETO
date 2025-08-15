delimiter //

create trigger impedir_alteracao_evento_passado
before update on evento
for each row
begin
    if old.data_hora < curdate() then
        signal sqlstate '45000'
        set message_text = 'Não é permitido alterar eventos que já ocorreram.';
    end if;
end;//

delimiter ;

-- testando a trigger em um evento antigo
update evento
set local = 'Novo Congresso'
where nome = 'Congresso de Tecnologia';

-- testando a trigger em um evento que ainda não ocorreu
update evento
set local = 'Teatro Central'
where nome = 'Feira Cultural de Inverno';