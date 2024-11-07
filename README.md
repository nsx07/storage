# Storage Api

Esse projeto eu desenvolvi no 5º semestre na matéria de Experiência Criativa, o propósito dele era ser suporte para lidar com arquivos e backups de um projeto maior, mas acabei gostando de desenvolver essa solução e mantive, atualmente ela está publicada como um template de projeto na [Railway](https://railway.app/template/iiWiUr) e tem cerca de 8 usuários que utilizam esse projeto ativamente.

É um serviço backend em Node.js/TypeScript para gerenciamento de armazenamento de arquivos e backups. O projeto implementa uma API REST com várias operações de arquivos e recursos de backup de banco de dados.

### Principais Funcionalidades

1. **Gerenciamento de Arquivos**

- Upload/download de arquivos
- Criação/exclusão de diretórios
- Movimentação, cópia e renomeação de arquivos/pastas
- Listagem da árvore de diretórios
- Manipulação de arquivos ZIP

2. **Sistema de Backup**

- Agendamento de backup de banco de dados (usando cron jobs)
- Suporte a backup de banco de dados PostgreSQL
- Restauração de backup
- Gerenciamento de tarefas de backup (criar/atualizar/excluir/listar)

3. **Autenticação**

- Middleware de autenticação baseada em token
- Validação de token baseada em ambiente

4. **Cache**

- Integração com Redis para cache
- Gerenciamento de sessão
- Persistência de tarefas de backup

### Componentes Principais

1. **Serviços**

- `FileService`: Gerencia operações do sistema de arquivos
- `BackupService`: Gerencia operações de backup do banco de dados
- `CacheService`: Implementação de cache baseada em Redis

2. **Classes Principais**

- `RequestFile`: Manipulação de operações com arquivos
- `DirectoryView`: Visualização da estrutura de diretórios
- `Zipper`: Operações com arquivos ZIP
- `Scheduler`: Gerenciamento de tarefas agendadas

### Stack Tecnológica

- TypeScript
- Express.js
- Node.js
- Redis
- PostgreSQL (para operações de backup)
- node-cron (para agendamento)
- multer (para upload de arquivos)

### Recursos de Segurança

- Prevenção contra atravessamento de diretório
- Proteção do diretório raiz
- Autenticação da API baseada em token
- Bypass de segurança configurável baseado em ambiente

# Pontos de Melhoria

## 1. Gerenciamento de Configurações

**Problema:** Configurações espalhadas pelo código dificultam manutenção e alterações entre ambientes.

**Solução:** Padrão Singleton com Config Manager

**Padrão:** Singleton

**Implementação:**

```typescript:src/config/ConfigManager.ts
export class ConfigManager {
    private static instance: ConfigManager;
    private config: Record<string, any>;

    private constructor() {
        this.config = {
            database: {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
            },
            redis: {
                host: process.env.REDIS_URL,
            },
            security: {
                token: process.env.STORAGE_TOKEN,
                bypass: process.env.BYPASS
            }
        };
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }

    public get(key: string): any {
        return this.config[key];
    }
}
```

**Uso:**

```typescript
const config = ConfigManager.getInstance();
const dbConfig = config.get("database");
```

## 2. Manipulação de Arquivos

**Problema:** Operações de arquivo podem estar muito acopladas e difíceis de estender.

**Solução:** Implementar Strategy Pattern para diferentes tipos de operações de arquivo

**Padrão:** Strategy

**Implementação:**

```typescript:src/services/file/strategies/FileOperationStrategy.ts
interface FileOperationStrategy {
    execute(path: string, options?: any): Promise<void>;
}

class CopyFileStrategy implements FileOperationStrategy {
    async execute(source: string, destination: string): Promise<void> {
        // Implementação da cópia
    }
}

class DeleteFileStrategy implements FileOperationStrategy {
    async execute(path: string): Promise<void> {
        // Implementação da deleção
    }
}

class FileOperationContext {
    private strategy: FileOperationStrategy;

    setStrategy(strategy: FileOperationStrategy) {
        this.strategy = strategy;
    }

    async executeOperation(path: string, options?: any): Promise<void> {
        return this.strategy.execute(path, options);
    }
}
```

**Uso:**

```typescript
const context = new FileOperationContext();
context.setStrategy(new CopyFileStrategy());
await context.executeOperation(sourcePath, destPath);
```

## 3. Sistema de Backup

**Problema:** Lógica de backup pode ser complexa e difícil de manter diferentes implementações.

**Solução:** Usar Template Method para definir esqueleto do processo de backup

**Padrão:** Template Method

**Implementação:**

```typescript:src/services/backup/BackupTemplate.ts
abstract class BackupTemplate {
    async execute() {
        await this.prepare();
        await this.dump();
        await this.compress();
        await this.store();
        await this.cleanup();
    }

    protected abstract prepare(): Promise<void>;
    protected abstract dump(): Promise<void>;
    protected abstract compress(): Promise<void>;
    protected abstract store(): Promise<void>;
    protected abstract cleanup(): Promise<void>;
}

class PostgresBackup extends BackupTemplate {
    protected async prepare(): Promise<void> {
        // Implementação específica
    }
    // ... outras implementações
}
```

**Uso:**

```typescript
const backup = new PostgresBackup();
await backup.execute();
```

## 4. Cache

**Problema:** Sistema de cache pode precisar suportar diferentes providers.

**Solução:** Implementar Factory Method para criar diferentes implementações de cache

**Padrão:** Factory Method

**Implementação:**

```typescript:src/services/cache/CacheFactory.ts
interface CacheProvider {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
}

class RedisCacheProvider implements CacheProvider {
    // Implementação Redis
}

class MemoryCacheProvider implements CacheProvider {
    // Implementação em memória
}

class CacheFactory {
    static createCache(type: string): CacheProvider {
        switch(type) {
            case 'redis':
                return new RedisCacheProvider();
            case 'memory':
                return new MemoryCacheProvider();
            default:
                throw new Error('Cache type not supported');
        }
    }
}
```

**Uso:**

```typescript
const cache = CacheFactory.createCache("redis");
await cache.set("key", "value");
```

## 5. Logging

**Problema:** Sistema de logs pode estar espalhado e inconsistente.

**Solução:** Implementar Observer Pattern para centralizar e distribuir logs

**Padrão:** Observer

**Implementação:**

```typescript:src/services/logging/Logger.ts
interface LogObserver {
    update(level: string, message: string, context?: any): void;
}

class FileLogger implements LogObserver {
    update(level: string, message: string, context?: any): void {
        // Log para arquivo
    }
}

class ConsoleLogger implements LogObserver {
    update(level: string, message: string, context?: any): void {
        // Log para console
    }
}

class LoggerSubject {
    private observers: LogObserver[] = [];

    attach(observer: LogObserver): void {
        this.observers.push(observer);
    }

    notify(level: string, message: string, context?: any): void {
        this.observers.forEach(observer => observer.update(level, message, context));
    }
}
```

**Uso:**

```typescript
const logger = new LoggerSubject();
logger.attach(new FileLogger());
logger.attach(new ConsoleLogger());
logger.notify("error", "Operação falhou", { operation: "backup" });
```

Cada uma dessas melhorias visa resolver um problema específico usando padrões de projeto apropriados. As implementações sugeridas:

- Melhoram a manutenibilidade do código
- Reduzem acoplamento
- Facilitam extensões futuras
- Tornam o código mais testável
- Seguem princípios SOLID

A escolha dos padrões foi baseada nas características específicas de cada problema e nas melhores práticas de desenvolvimento de software.
