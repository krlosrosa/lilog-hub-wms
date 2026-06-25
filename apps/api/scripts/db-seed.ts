/**
 * db:seed — insere dados iniciais (usuários, etc.) no banco.
 *
 * USE ONLY IN DEVELOPMENT / first-time setup.
 *
 * Run: pnpm --filter api db:seed
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv(): void {
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env optional if DATABASE_URL is already in environment
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Check apps/api/.env');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const SEED_UNIDADE_ID = 'UN-SEED-001';
const SEED_CENTRO_ID = '00000000-0000-4000-8000-000000000001';

type EnderecoSeed = {
  zona: string;
  rua: string;
  posicao: string;
  nivel: string;
  tipo:
    | 'picking'
    | 'pulmao'
    | 'recebimento'
    | 'expedicao'
    | 'avaria'
    | 'inventario'
    | 'cross_docking'
    | 'doca';
  status: 'disponivel' | 'ocupado' | 'bloqueado' | 'inventario' | 'inativo';
  tipoEstrutura: 'porta-palete' | 'drive-in' | 'estante-dinamica' | 'flow-rack';
  larguraMm: number;
  alturaMm: number;
  profundidadeMm: number;
  cargaMaxKg: number;
  capacidadeVolume?: number;
  prioridadePicking?: number;
  vinculoSkuFixo?: boolean;
  regraLoteUnico?: boolean;
  permiteMisturaValidade?: boolean;
  permiteFracionado?: boolean;
  curvaAbc?: 'A' | 'B' | 'C';
  ocupacaoPercent?: number;
  observacao?: string;
};

function buildEnderecoCodigo(
  zona: string,
  rua: string,
  posicao: string,
  nivel: string,
): string {
  return `${zona.trim().toUpperCase()} ${rua.trim().padStart(4, '0')} ${posicao.trim().padStart(3, '0')} ${nivel.trim().padStart(2, '0')}`;
}

const ENDERECO_TEMPLATES: EnderecoSeed[] = [
  {
    zona: 'A',
    rua: '0001',
    posicao: '001',
    nivel: '01',
    tipo: 'picking',
    status: 'disponivel',
    tipoEstrutura: 'porta-palete',
    larguraMm: 1200,
    alturaMm: 2000,
    profundidadeMm: 1000,
    cargaMaxKg: 500,
    capacidadeVolume: 2.4,
    prioridadePicking: 1,
    curvaAbc: 'A',
    observacao: 'Corredor A — picking classe A',
  },
  {
    zona: 'A',
    rua: '0001',
    posicao: '001',
    nivel: '02',
    tipo: 'picking',
    status: 'ocupado',
    tipoEstrutura: 'porta-palete',
    larguraMm: 1200,
    alturaMm: 2000,
    profundidadeMm: 1000,
    cargaMaxKg: 500,
    capacidadeVolume: 2.4,
    prioridadePicking: 2,
    curvaAbc: 'A',
    ocupacaoPercent: 78,
  },
  {
    zona: 'A',
    rua: '0001',
    posicao: '002',
    nivel: '01',
    tipo: 'picking',
    status: 'disponivel',
    tipoEstrutura: 'porta-palete',
    larguraMm: 1200,
    alturaMm: 2000,
    profundidadeMm: 1000,
    cargaMaxKg: 500,
    prioridadePicking: 3,
    curvaAbc: 'B',
  },
  {
    zona: 'A',
    rua: '0002',
    posicao: '001',
    nivel: '01',
    tipo: 'pulmao',
    status: 'ocupado',
    tipoEstrutura: 'drive-in',
    larguraMm: 2400,
    alturaMm: 4000,
    profundidadeMm: 1200,
    cargaMaxKg: 2000,
    capacidadeVolume: 11.5,
    curvaAbc: 'B',
    ocupacaoPercent: 92,
    regraLoteUnico: true,
  },
  {
    zona: 'B',
    rua: '0005',
    posicao: '010',
    nivel: '03',
    tipo: 'recebimento',
    status: 'disponivel',
    tipoEstrutura: 'flow-rack',
    larguraMm: 1500,
    alturaMm: 2500,
    profundidadeMm: 1200,
    cargaMaxKg: 800,
    observacao: 'Doca de recebimento',
  },
  {
    zona: 'B',
    rua: '0005',
    posicao: '011',
    nivel: '01',
    tipo: 'cross_docking',
    status: 'disponivel',
    tipoEstrutura: 'flow-rack',
    larguraMm: 1800,
    alturaMm: 2500,
    profundidadeMm: 1200,
    cargaMaxKg: 600,
    permiteFracionado: true,
  },
  {
    zona: 'C',
    rua: '0010',
    posicao: '050',
    nivel: '10',
    tipo: 'expedicao',
    status: 'disponivel',
    tipoEstrutura: 'estante-dinamica',
    larguraMm: 1200,
    alturaMm: 2200,
    profundidadeMm: 1000,
    cargaMaxKg: 700,
    prioridadePicking: 5,
    curvaAbc: 'C',
  },
  {
    zona: 'C',
    rua: '0010',
    posicao: '051',
    nivel: '01',
    tipo: 'avaria',
    status: 'bloqueado',
    tipoEstrutura: 'porta-palete',
    larguraMm: 1200,
    alturaMm: 2000,
    profundidadeMm: 1000,
    cargaMaxKg: 400,
    vinculoSkuFixo: true,
    observacao: 'Área de avaria — bloqueada para auditoria',
  },
  {
    zona: 'D',
    rua: '0003',
    posicao: '001',
    nivel: '01',
    tipo: 'inventario',
    status: 'inventario',
    tipoEstrutura: 'porta-palete',
    larguraMm: 1200,
    alturaMm: 2000,
    profundidadeMm: 1000,
    cargaMaxKg: 500,
    observacao: 'Reservado para contagem cíclica',
  },
  {
    zona: 'D',
    rua: '0003',
    posicao: '002',
    nivel: '01',
    tipo: 'doca',
    status: 'inativo',
    tipoEstrutura: 'flow-rack',
    larguraMm: 2000,
    alturaMm: 3000,
    profundidadeMm: 1500,
    cargaMaxKg: 1000,
    observacao: 'Doca desativada',
  },
];

async function seed() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('123456', 10);

  await sql.unsafe(`
    INSERT INTO master_data.unidades (id, nome, cluster, nome_filial)
    VALUES ('${SEED_UNIDADE_ID}', 'CD Seed', 'Cross', 'Filial Seed')
    ON CONFLICT (id) DO UPDATE
      SET nome = EXCLUDED.nome,
          cluster = EXCLUDED.cluster,
          nome_filial = EXCLUDED.nome_filial;
  `);

  await sql.unsafe(`
    INSERT INTO auth.funcionarios (unidade_id, matricula, nome, cargo, situacao, data_admissao)
    VALUES
      ('${SEED_UNIDADE_ID}', '421931', 'Carlos Roberto', 'supervisor', 'ativo', '2020-01-01'),
      ('${SEED_UNIDADE_ID}', '421932', 'Ricardo Silva', 'conferente', 'ativo', '2020-01-01'),
      ('${SEED_UNIDADE_ID}', '421933', 'Ana Martins', 'separadora', 'ativo', '2020-01-01')
    ON CONFLICT (unidade_id, matricula) DO UPDATE
      SET nome = EXCLUDED.nome,
          cargo = EXCLUDED.cargo,
          situacao = EXCLUDED.situacao;
  `);

  await sql.unsafe(`
    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT 421931, 'Carlos Roberto', '421931@lilog.com', '${passwordHash}', 'admin', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421931' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;

    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT 421932, 'Ricardo Silva', 'ricardo@lilog.com', '${passwordHash}', 'operator', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421932' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;

    INSERT INTO auth.users (id, name, email, password_hash, role, funcionario_id)
    SELECT 421933, 'Ana Martins', 'ana@lilog.com', '${passwordHash}', 'operator', f.id
      FROM auth.funcionarios f
      WHERE f.matricula = '421933' AND f.unidade_id = '${SEED_UNIDADE_ID}'
    ON CONFLICT (id) DO UPDATE
      SET name           = EXCLUDED.name,
          email          = EXCLUDED.email,
          password_hash  = EXCLUDED.password_hash,
          role           = EXCLUDED.role,
          funcionario_id = EXCLUDED.funcionario_id;
  `);

  await sql.unsafe(`
    INSERT INTO master_data.centros (id, unidade_id, centro, empresa, nome)
    VALUES ('${SEED_CENTRO_ID}', '${SEED_UNIDADE_ID}', '1001', 'LDB', 'Centro Seed Inventário')
    ON CONFLICT (id) DO UPDATE
      SET unidade_id = EXCLUDED.unidade_id,
          centro = EXCLUDED.centro,
          empresa = EXCLUDED.empresa,
          nome = EXCLUDED.nome;
  `);

  await sql.unsafe(`
    INSERT INTO estoque.depositos (
      unidade_id, codigo, nome, finalidade,
      permite_venda, permite_picking, exige_endereco, conta_disponivel, sistema, ativo
    )
    VALUES
      ('${SEED_UNIDADE_ID}', 'TRANSF', 'Transferência', 'transferencia', false, false, false, false, true, true),
      ('${SEED_UNIDADE_ID}', 'AGUARD_ARM', 'Aguardando Armazenagem', 'aguardando_armazenagem', false, false, true, false, true, true),
      ('${SEED_UNIDADE_ID}', 'AVARIA', 'Avaria', 'avaria', false, false, false, false, true, true),
      ('${SEED_UNIDADE_ID}', 'DEB_TRANSP', 'Débito Transportadora', 'debito_transportadora', false, false, false, false, true, true),
      ('${SEED_UNIDADE_ID}', 'QUARENTENA', 'Quarentena', 'quarentena', false, false, false, false, true, true)
    ON CONFLICT (unidade_id, codigo) DO UPDATE
      SET nome = EXCLUDED.nome,
          finalidade = EXCLUDED.finalidade,
          permite_venda = EXCLUDED.permite_venda,
          permite_picking = EXCLUDED.permite_picking,
          exige_endereco = EXCLUDED.exige_endereco,
          conta_disponivel = EXCLUDED.conta_disponivel,
          sistema = EXCLUDED.sistema,
          ativo = EXCLUDED.ativo,
          updated_at = NOW();
  `);

  const centrosSeed = await sql<{ id: string; centro: string }[]>`
    SELECT id, centro
    FROM master_data.centros
  `;

  const centroIds = centrosSeed.map((centro) => centro.id);

  if (centroIds.length > 0) {
    const removedLegacy = await sql`
      DELETE FROM master_data.enderecos e
      WHERE e.centro_id IN ${sql(centroIds)}
        AND e.endereco_mascarado LIKE '%-%'
        AND NOT EXISTS (
          SELECT 1
          FROM estoque.demanda_enderecos de
          WHERE de.endereco_id = e.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM estoque.movement_records mr
          WHERE mr.from_location = e.endereco_mascarado
             OR mr.to_location = e.endereco_mascarado
        )
    `;

    console.log(
      `✓ ${removedLegacy.count} endereço(s) legado(s) removido(s) (formato antigo CD-ZN-RU-...)`,
    );
  }

  let enderecosInseridos = 0;

  for (const centro of centrosSeed) {
    for (const template of ENDERECO_TEMPLATES) {
      const enderecoMascarado = buildEnderecoCodigo(
        template.zona,
        template.rua,
        template.posicao,
        template.nivel,
      );

      await sql`
        INSERT INTO master_data.enderecos (
          endereco_mascarado,
          centro_id,
          zona,
          rua,
          posicao,
          nivel,
          tipo,
          status,
          tipo_estrutura,
          largura_mm,
          altura_mm,
          profundidade_mm,
          carga_max_kg,
          capacidade_volume,
          prioridade_picking,
          vinculo_sku_fixo,
          regra_lote_unico,
          permite_mistura_validade,
          permite_fracionado,
          curva_abc,
          ocupacao_percent,
          observacao
        )
        VALUES (
          ${enderecoMascarado},
          ${centro.id},
          ${template.zona},
          ${template.rua},
          ${template.posicao},
          ${template.nivel},
          ${template.tipo},
          ${template.status},
          ${template.tipoEstrutura},
          ${template.larguraMm},
          ${template.alturaMm},
          ${template.profundidadeMm},
          ${template.cargaMaxKg},
          ${template.capacidadeVolume ?? null},
          ${template.prioridadePicking ?? null},
          ${template.vinculoSkuFixo ?? false},
          ${template.regraLoteUnico ?? false},
          ${template.permiteMisturaValidade ?? false},
          ${template.permiteFracionado ?? false},
          ${template.curvaAbc ?? 'B'},
          ${template.ocupacaoPercent ?? 0},
          ${template.observacao ?? null}
        )
        ON CONFLICT (centro_id, endereco_mascarado) DO UPDATE
          SET zona = EXCLUDED.zona,
              rua = EXCLUDED.rua,
              posicao = EXCLUDED.posicao,
              nivel = EXCLUDED.nivel,
              tipo = EXCLUDED.tipo,
              status = EXCLUDED.status,
              tipo_estrutura = EXCLUDED.tipo_estrutura,
              largura_mm = EXCLUDED.largura_mm,
              altura_mm = EXCLUDED.altura_mm,
              profundidade_mm = EXCLUDED.profundidade_mm,
              carga_max_kg = EXCLUDED.carga_max_kg,
              capacidade_volume = EXCLUDED.capacidade_volume,
              prioridade_picking = EXCLUDED.prioridade_picking,
              vinculo_sku_fixo = EXCLUDED.vinculo_sku_fixo,
              regra_lote_unico = EXCLUDED.regra_lote_unico,
              permite_mistura_validade = EXCLUDED.permite_mistura_validade,
              permite_fracionado = EXCLUDED.permite_fracionado,
              curva_abc = EXCLUDED.curva_abc,
              ocupacao_percent = EXCLUDED.ocupacao_percent,
              observacao = EXCLUDED.observacao,
              updated_at = now()
      `;

      enderecosInseridos += 1;
    }
  }

  const amostra = await sql<{ endereco_mascarado: string; tipo: string; status: string }[]>`
    SELECT endereco_mascarado, tipo, status
    FROM master_data.enderecos
    WHERE centro_id = ${SEED_CENTRO_ID}
    ORDER BY endereco_mascarado
    LIMIT 5
  `;

  console.log('✓ Funcionários e usuários criados (421931 admin, 421932/421933 operators)');
  console.log(`✓ Centro seed: ${SEED_CENTRO_ID}`);
  console.log(
    `✓ ${enderecosInseridos} endereços WMS inseridos/atualizados em ${centrosSeed.length} centro(s)`,
  );
  console.log('✓ Amostra do novo padrão (ZONA RUA POSICAO NIVEL):');
  for (const row of amostra) {
    console.log(`  - ${row.endereco_mascarado} | ${row.tipo} | ${row.status}`);
  }

  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
