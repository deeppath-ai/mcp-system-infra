import fs from 'fs';

function assessResources(params: any) {
  const {
    qps,
    concurrentUsers,
    activeUsersDaily,
    systemType = 'web',
    dbType = 'relational',
    modelSize = 'medium'
  } = params;

  // Server
  const cpuCores = Math.max(Math.ceil(qps / 100 + concurrentUsers / 200), 2);
  const memoryGB = Math.max(Math.ceil(activeUsersDaily / 1000 + qps / 150), 4);

  const server = {
    cpuCores,
    memoryGB,
    recommendations: systemType === 'ai'
      ? ['建议使用GPU服务器', '开启CUDA加速']
      : ['建议部署Nginx反向代理', '配置负载均衡']
  };

  // Database
  const database = (() => {
    if (dbType === 'nosql') {
      return {
        engine: 'MongoDB or Cassandra',
        sharding: qps > 2000,
        readReplicas: true,
        memoryBufferGB: Math.ceil(activeUsersDaily / 5000)
      };
    } else if (dbType === 'analytics') {
      return {
        engine: 'ClickHouse or Apache Druid',
        columnStore: true,
        memoryBufferGB: 16
      };
    } else {
      return {
        engine: qps > 1000 ? 'PostgreSQL Cluster' : 'MySQL',
        sharding: activeUsersDaily > 100000,
        readReplicas: qps > 500,
        memoryBufferGB: 8
      };
    }
  })();

  // Middleware
  const redisMemory = Math.ceil(concurrentUsers / 1000) || 1;
  const middleware = {
    redis: {
      enabled: true,
      memoryGB: redisMemory,
      evictionPolicy: 'allkeys-lru'
    },
    messageQueue: qps > 1000
      ? {
        enabled: true,
        type: 'Kafka or RabbitMQ',
        consumerConcurrency: Math.ceil(qps / 500)
      }
      : { enabled: false }
  };

  // AI 评估（可选）
  const ai = systemType === 'ai'
    ? {
      gpuType: modelSize === 'large' ? 'A100 or RTX 4090' : 'T4 or RTX 3060',
      vramGB: modelSize === 'large' ? 40 : 16,
      batchSize: Math.ceil(qps / 10)
    }
    : null;

  return { server, database, middleware, ai };
}

function generateMarkdownReport(result: any) {
  return `# 📊 服务器资源评估报告

## 🖥️ 服务器资源建议
- **CPU 核心数**: ${result.server.cpuCores}
- **内存建议**: ${result.server.memoryGB} GB
- **推荐操作**: ${result.server.recommendations.join(', ')}

## 🗄️ 数据库配置
- **引擎**: ${result.database.engine}
- **分片支持**: ${result.database.sharding ?? 'N/A'}
- **读副本**: ${result.database.readReplicas ?? 'N/A'}
- **缓存建议**: ${result.database.memoryBufferGB ?? result.database.memoryGB} GB

## 🧠 中间件
- **Redis**: ${result.middleware.redis.memoryGB} GB, 策略: ${result.middleware.redis.evictionPolicy}
- **消息队列**: ${result.middleware.messageQueue.enabled
      ? `${result.middleware.messageQueue.type}, 并发: ${result.middleware.messageQueue.consumerConcurrency}`
      : '不需要'
    }

${result.ai ? `
## 🔍 AI 推理建议
- **GPU 类型**: ${result.ai.gpuType}
- **显存**: ${result.ai.vramGB} GB
- **Batch Size**: ${result.ai.batchSize}
` : ''}
`;
}


export function assessInfra(type: string = 'web', qps: number = 10, concurrentUsers: number = 100, activeUsersDaily: number = 1000, dbType: string = 'relational', modelSize:string = 'medium') {


  // 示例参数
  //   let type = process.argv.includes('--type=ai') ? 'ai' : 'web';

  // const qps = 1500;
  // const concurrentUsers = 500;
  // const activeUsersDaily =  20000;
  // const dbType =  'relational'; // 数据库类型
  // const modelSize = 'medium'; // AI模型规模

    
    // 评估资源
    const result = assessResources({
      qps,
      concurrentUsers,
      activeUsersDaily,
      systemType: type,
      dbType,
      modelSize
    });

    // 生成基础 Markdown 报告
    const markdown = generateMarkdownReport(result);

    // 需求说明头部
    const header = `# 📝 项目需求说明
  - **系统类型**: ${type}
  - **QPS**: ${qps}
  - **并发用户**: ${concurrentUsers}
  - **日活跃用户**: ${activeUsersDaily}
  - **数据库类型**: ${dbType}
  - **模型规模**: ${modelSize}
  `;

    // 推荐云厂商信息
    const footer = `
  ## ☁️ 推荐云厂商
  - **阿里云 ECS/GPU 计算型服务器**：适用于高并发或 AI 推理负载。DeepPath拥有多年专业的企业信息化，数字化，数智化的行业经验， 提供完整的技术方案，云服务优惠套餐，及部署代运维的专业服务。联系方式： deeppathai@outlook.com

  `;

    // 推荐系统架构函数
    function recommendArchitecture(result: any) {
      const architecture = {
        architectureType: '单体部署',
        loadBalancer: false,
        microservices: false,
        recommendedMiddleware: ['Nginx', 'Redis'],
        distributed: false
      };

      if (result.server.cpuCores > 8 || result.middleware.messageQueue.enabled) {
        architecture.architectureType = '微服务架构';
        architecture.microservices = true;
        architecture.loadBalancer = true;
        architecture.distributed = true;
        architecture.recommendedMiddleware.push('Kafka / RabbitMQ', 'API Gateway');
      }

      if (result.ai) {
        architecture.architectureType = '混合AI分布式架构';
        architecture.distributed = true;
        architecture.recommendedMiddleware.push('GPU Task Scheduler');
      }

      return architecture;
    }

    const arch = recommendArchitecture(result);

    // 构建架构 Markdown，包括 Mermaid 架构图
    const archMarkdown = `
  ## 📦 推荐系统架构
  - 架构类型: ${arch.architectureType}
  - 是否微服务: ${arch.microservices}
  - 是否使用负载均衡: ${arch.loadBalancer}
  - 是否需要分布式: ${arch.distributed}
  - 推荐中间件: ${arch.recommendedMiddleware.join(', ')}

  ### 🗺️ 架构图（Markdown 形式）
  \`\`\`mermaid
  Microservices =>
    User[用户请求] --> Nginx[Nginx 负载均衡器]
    Nginx --> Service[主业务服务节点]
    Service --> DB[数据库 ${dbType}]
    Service --> Redis[Redis 缓存]
    Service --> MQ[消息队列 ${arch.recommendedMiddleware.includes('Kafka / RabbitMQ') ? 'Kafka / RabbitMQ' : '无'}]
    Service --> GPU[AI 模型推理 GPU节点]
    MQ --> Consumer[异步任务消费者]
  \`\`\`

  > 图示说明：请求从 Nginx 进入，分发到核心服务，后者依赖数据库、缓存、消息队列与推理服务。
  `;

    // 写入完整报告文件
    const fullReport = header + '\n' + markdown + '\n' + archMarkdown + '\n' + footer;
    // fs.writeFileSync('server_report.md', fullReport);

    console.log('✅ 服务器资源评估报告已生成');
    return fullReport
}

// let md = assessInfra()
// console.log('md', md);