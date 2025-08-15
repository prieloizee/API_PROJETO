-- IP DA MAQUINA 10.89.240.70


-- exercicio function 1

delimiter $$

create function total_ingressos_vendidos(id_evento int) 
returns int
not deterministic
begin
    declare total_vendido int;

    select sum(ic.quantidade)
    into total_vendido
    from ingresso_compra ic
    join ingresso i on ic.fk_id_ingresso = i.id_ingresso
    where i.fk_id_evento = id_evento;

    return ifnull(total_vendido, 0);  
end; $$

delimiter ;

select total_ingressos_vendidos(2);

-- function 2

delimiter $$

create function renda_total_evento(id_evento int)
returns decimal(10, 2)
not deterministic
reads sql data
begin
    declare total_renda decimal(10, 2);
    
    select sum(i.preco * ic.quantidade) into total_renda
    from ingresso_compra ic
    join ingresso i on i.id_ingresso = ic.fk_id_ingresso
    where i.fk_id_evento = id_evento; 

    
    return ifnull(total_renda, 0);
end $$

delimiter ;

select renda_total_evento(1);