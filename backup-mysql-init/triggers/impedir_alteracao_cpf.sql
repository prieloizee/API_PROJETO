delimiter //
create trigger impedir_alteracao_cpf
before update on usuario
for each row
begin 
    if old.cpf <> new.cpf then
    -- mensagem personalizada
        signal sqlstate '45000'
        set message_text = 'Não é possível alterar o CPF de um usuário já cadastrado';
    end if;
end; //

delimiter ;

-- tentativa para atualizar o nome

update usuario
set name = 'João da Silva'
where id_usuario = 1;

-- tentativa para atualizar o CPF (deve gerar um erro)

update usuario
set cpf = '16000000000'
where id_usuario = 1;