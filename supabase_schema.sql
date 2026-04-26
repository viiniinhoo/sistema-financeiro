-- Habilita extensão para UUID se não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de HouseHolds (Casais/Grupos)
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela de Categorias
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    budget_limit NUMERIC DEFAULT 0,
    type TEXT CHECK (type IN ('income', 'expense')) DEFAULT 'expense',
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Transações
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT, -- Nome da categoria (redundância para busca rápida)
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    created_by TEXT, -- Nome do usuário (Metadata)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    installment_total INTEGER,
    installment_current INTEGER,
    installment_group_id UUID,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Contas Fixas (Vencimentos)
CREATE TABLE fixed_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
    category TEXT,
    is_paid BOOLEAN DEFAULT false,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Metas (Goals)
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC DEFAULT 0,
    icon TEXT,
    deadline DATE,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) - CRÍTICO PARA SUPABASE
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Exemplo: Usuário só vê o que pertence ao seu Household)
-- NOTA: Estas políticas assumem que o household_id é injetado ou verificado via auth.uid()
-- Em um sistema multi-tenant, você deve garantir que o usuário pertence ao household_id.

CREATE POLICY "Users can view their own household data" ON households 
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can interact with categories in their household" ON categories 
    FOR ALL USING (household_id IS NOT NULL);

CREATE POLICY "Users can interact with transactions in their household" ON transactions 
    FOR ALL USING (household_id IS NOT NULL);

CREATE POLICY "Users can interact with fixed_bills in their household" ON fixed_bills 
    FOR ALL USING (household_id IS NOT NULL);

CREATE POLICY "Users can interact with goals in their household" ON goals 
    FOR ALL USING (household_id IS NOT NULL);

-- SEED DATA: Categorias Iniciais Padrão
-- Nota: Para estes funcionarem, você precisará atualizar o household_id após criar o primeiro.
/*
INSERT INTO categories (name, icon, budget_limit, type) VALUES 
('Alimentação', '🍎', 1200, 'expense'),
('Lazer', '🎬', 800, 'expense'),
('Moradia', '🏠', 3500, 'expense'),
('Saúde', '🏥', 500, 'expense'),
('Transporte', '🚗', 600, 'expense'),
('Salário', '💰', 0, 'income'),
('Freelance', '💻', 0, 'income'),
('Investimentos', '📈', 0, 'income');
*/
