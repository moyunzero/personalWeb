---
title: System Design Course – APIs, Databases, Caching, CDNs, Load Balancing &
  Production Infra
slug: 2026-05-27-system-design-course-apis-databases-cach
description: ""
author: 墨韵
date: 2026-04-20
categories:
  - note
tags:
  - 计算机
draft: false
notionId: 36ddf5c0-26f4-807e-b1c6-c44b34058978
notionSyncedAt: 2026-05-27T05:52:28.655Z
---

### 1. 引言


系统设计（System Design）是**中级 → 高级/资深工程师**的必备技能。

- 公司不是只招“会写代码”的人，而是招能做**架构决策**、让系统**高性能、可扩展、安全、生产就绪**的人。
- 本课程路径：从**单服务器**起步 → 数据库选型 → 扩展策略 → 负载均衡 → API 设计 → 协议/传输层 → REST/GraphQL → 认证授权 → 安全 + 生产基础设施（Caching、CDNs 等）。
- 核心思维：**从小到大**（先理解单机，再思考分布式）；避免过早优化（Premature Optimization）。**最佳实践**：面试时先问清楚需求（QPS、Latency、Consistency），再画架构图、估算容量、权衡取舍。

### 2. 单服务器设置（Single Server Setup）


**请求完整流程**：

1. 用户输入域名 → DNS 解析为 IP
2. 浏览器/APP 发送 HTTP 请求
3. 服务器处理（业务逻辑 + 数据库查询）
4. 返回 HTML（网页）或 JSON（API）

**图示**（最基础架构）：


![figure-1-1-WCFZBBLA_%281%29.webp](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-375d687e8d.webp)


**代码示例**（Node.js 简单服务器）：


```javascript
const express = require('express');
const app = express();

app.get('/products/:id', async (req, res) => {
  const product = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json(product);
});

app.listen(3000);
```


**最佳实践**：从小规模单机开始，理解每个组件瓶颈（CPU、内存、DB I/O），再扩展。生产中**绝不**把前端和后端、DB 混在同一台服务器（三层架构：Presentation / Logic / Data）。


![4a38175b-11e8-40ae-879c-ab3ce2027089_2008x1252.jpg](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-e9d2534f95.jpg)


### 3. 数据库：SQL、NoSQL、Graph


**SQL（关系型，如 PostgreSQL、MySQL）**：

- 结构化表 + JOIN + 事务（**ACID**：原子性、一致性、隔离性、持久性）。
- 适用：金融、订单、需要强一致性的场景。

**NoSQL**：

- **文档型**（MongoDB）：灵活 Schema，嵌套 JSON。
- **宽列型**（Cassandra）：海量写入、高吞吐。
- **键值型**（Redis）：内存级，极低延迟（缓存/会话）。
- **图数据库**（Neo4j）：关系查询（社交、推荐引擎）。

**对比图**：


![differences-between-sql-databases-and-nosql-databases.webp](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-66902c9492.webp)


![sql-vs-nosql-comparision.webp](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-7cf17d8f9c.webp)


**选择原则**：

- 数据**强一致性 + 事务** → SQL
- **灵活 Schema + 高并发** → NoSQL
- **复杂关系查询** → Graph**生产建议**：Polyglot Persistence（混合使用），例如主业务用 PostgreSQL，缓存用 Redis，推荐用 Neo4j。

### 4. 垂直扩展 vs 水平扩展


**垂直扩展（Scale Up）**：单机加 CPU/内存/存储。简单，但有硬件上限、单点故障。


**水平扩展（Scale Out）**：加多台服务器 + 负载均衡。无限扩展、高可用，但需解决数据一致性。


**最佳实践**：初期用垂直（快速验证），流量起来后立刻转向水平 + 微服务。


### 5. 负载均衡（Load Balancing）


**作用**：把请求均匀分发到多台后端服务器。


**常见算法**

- Round Robin（轮询）
- Least Connections（最少连接）
- Least Response Time（最快响应）
- IP Hash（会话粘滞）
- Weighted / Geographical / **Consistent Hashing**（缓存友好）

**健康检查**：定期 Ping 服务器（HTTP/TCP），自动摘除故障节点。


**实现方式**：NGINX、HAProxy（软件）、AWS ELB（云托管）。


**图示**：


![1650e3bc-2d6b-47ee-8370-a5e1b1c79abf_1600x1032.png](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-52a2f45db7.png)


![Diagram-1--1--1.jpg](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-5186f17e53.jpg)


**Caching & CDN 融入**：负载均衡前可加 CDN 缓存静态资源，极大降低后端压力（生产基础设施核心）。


### 6. 健康检查（Health Checks）


负载均衡器每隔几秒发送探测请求（/health）。

- 200 OK → 正常
- 超时/500 → 自动下线节点**最佳实践**：健康检查 + 自动重启容器（Kubernetes readiness/liveness probe）。

### 7. 单点故障（SPOF）


**定义**：一个组件挂掉 → 整个系统崩溃。


**解决方案**：

- 多实例负载均衡 + 自动 failover
- 数据库主从复制 + 分片
- 多可用区（Multi-AZ）部署**生产建议**：**任何关键路径都必须冗余**。

### 8. API 设计（API Design）


API 是**客户端与服务器的契约**。


**设计流程**：需求 → 契约优先（Contract-First） → 版本化 → 文档（OpenAPI） → 废弃策略。


**原则**：一致性、无状态、安全、性能（分页、缓存、限流）。


### 9. API 协议（API Protocols）

- **HTTP/HTTPS**：请求-响应
- **WebSocket**：实时双向（聊天、推送）
- **gRPC**：HTTP/2 + Protocol Buffers，高性能微服务（视频强调：**微服务间首选**）
- **AMQP**：异步消息队列

**传输层**（0:59:10 - 1:04:22）：

- **TCP**：可靠、有序（支付、登录）
- **UDP**：快、无序（视频、游戏）

### 10. RESTful API


**核心**：资源为中心（名词），HTTP 方法映射 CRUD。


**示例**：


```plain text
GET    /api/products                  # 查询列表
GET    /api/products/123              # 查询单个
POST   /api/products                  # 创建
PUT    /api/products/123              # 全量更新
PATCH  /api/products/123              # 部分更新
DELETE /api/products/123              # 删除
```


**查询参数**：`?page=1&limit=10&sort=price&filter[category]=electronics`


**状态码最佳实践**：200、201、400、401、404、429（限流）、500。


**图示**：


![rest_api_works.png](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-abc31d071c.png)


![3605e817-3083-4fbe-9faa-bc626cfb497a_1938x1246.png](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-421e2be1a7.png)


**最佳实践**：无状态、HATEOAS（可选）、统一错误格式 `{ "code": 400, "message": "..." }`。


### 11. GraphQL


**解决 REST 的 Over-fetching / Under-fetching**。


单一端点 `/graphql`，客户端精确声明数据。


**示例 Schema & Query**：


```graphql
# Schema
type Query {
  user(id: ID!): User
}
type User {
  id: ID!
  name: String!
  posts: [Post!]!
}

# Client Query
query {
  user(id: "123") {
    name
    posts {
      title
      comments { text }
    }
  }
}
```


**错误处理**：永远返回 200，errors 数组里放错误。


**最佳实践**：限制查询深度、防 N+1、用 DataLoader。


### 12. 认证（Authentication）（1:24:52 - 1:45:51）


**“你是谁？”**


**主流方案**（视频详细对比）：

- Session（有状态，Redis 存储）
- **JWT**（无状态，推荐）：Access Token（短效）+ Refresh Token（长效）

**JWT 流程图**：


![https___dev-to-uploads.s3.amazonaws.com_uploads_articles_8wiw2dbjerzq6br66qv8.webp](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-a4fd9bc07a.webp)


**Node.js JWT 示例**（生产级）：


```javascript
// 签发
const token = jwt.sign({ userId: 123, role: 'admin' }, SECRET, { expiresIn: '15m' });

// 验证（中间件）
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
};
```


**SSO**：SAML（企业旧系统） vs OIDC（现代，基于 JWT）。


### 13. 授权（Authorization）


**“你能做什么？”**


**三大模型**：

- **RBAC**（Role-Based）：用户 → 角色 → 权限（最常用）
- **ABAC**（Attribute-Based）：结合用户/资源/环境属性（最灵活）
- **ACL**（Access Control List）：资源级权限列表

**对比表**：


![access-control-models-comparison.jpg](images/blog/2026-05-27-system-design-course-apis-databases-cach/img-f69dc4ee5f.jpg)


**最佳实践**：真实系统**RBAC + ABAC 混合**，权限写在 JWT Claims 中。


### 14. 安全 + 生产基础设施（Security & Production Infra）


**贯穿全程的安全**：

- HTTPS 强制
- 输入验证 + 限流（Rate Limiting）
- WAF、DDoS 防护
- **Caching**：Redis（热点数据、Session）
- **CDN**：边缘缓存静态资源 + 全球加速
- 审计日志、敏感数据加密、GDPR 合规

**生产就绪 checklist**：

- 多 AZ 部署
- 自动扩缩容
- 监控 + 告警（Prometheus + Grafana）
- 蓝绿/金丝雀部署