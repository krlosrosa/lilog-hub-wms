UPDATE auth.funcionarios SET cargo = 'operador_empilhadeira' WHERE cargo = 'operador_empilhadeia';--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'auxiliar_I' WHERE cargo = 'estoquista';--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'auxiliar_II' WHERE cargo = 'inventariante';--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'separador' WHERE cargo IN ('carregador', 'separadora');--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'conferente' WHERE cargo = 'recebedor';--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'lider' WHERE cargo = 'gerente';--> statement-breakpoint
UPDATE auth.funcionarios SET cargo = 'administrativo' WHERE cargo IN ('analista', 'administrador');
