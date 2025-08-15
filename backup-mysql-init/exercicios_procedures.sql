-- IP DA MAQUINA 10.89.240.70


-- exercicio de procedures 1
-- procedure para resumo do usuario

delimiter $$

create procedure resumo_evento(in pid_evento int)
begin
    declare nome_evento varchar(100);
    declare data_evento date;
    declare total_ingressos int;
    declare renda_total decimal(10,2);

   
    select e.nome, e.data_hora into nome_evento, data_evento
    from evento e
    where e.id_evento = pid_evento;

    
    select ifnull(sum(ic.quantidade), 0) into total_ingressos
    from ingresso_compra ic
    join ingresso i on i.id_ingresso = ic.fk_id_ingresso
    where i.fk_id_evento = pid_evento;

    
    select ifnull(sum(i.preco * ic.quantidade), 0) into renda_total
    from ingresso_compra ic
    join ingresso i on i.id_ingresso = ic.fk_id_ingresso
    where i.fk_id_evento = pid_evento;

    
    select nome_evento as nome_evento,
           data_evento as data_evento,
           total_ingressos as total_ingressos_vendidos,
           renda_total as renda_total;
end $$

delimiter ;

call resumo_evento(3);