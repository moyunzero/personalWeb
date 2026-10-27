---
title: "Secure by Design: How to Engineer Security into Architecture Before
  Writing Any Code"
slug: 2026-10-15-secure-by-design-how-to-engineer-securit
description: 在大多数工程团队中，有一场对话往往发生得太晚。设想一下：一个功能已部署到生产环境。之后才进行安全审查，或者渗透测试发现了问题，甚至更糟——一封事件报告邮件躺在你的收件箱里。漏洞是真实存在的，修复成本高昂。在讨论的某个环节，有人会说“我们需要给这个加上安全防护”。问题恰恰出在这句话上：
  安全性不是往软件上“添加”的东西，…
author: 墨韵
date: 2026-10-15
categories:
  - note
tags:
  - 网络安全
draft: false
notionId: 3fedf5c0-26f4-80a1-8675-c8fc6df4245e
notionSyncedAt: 2026-10-19T07:11:41.923Z
---

在大多数工程团队中，有一场对话往往发生得太晚。设想一下：一个功能已部署到生产环境。之后才进行安全审查，或者渗透测试发现了问题，甚至更糟——一封事件报告邮件躺在你的收件箱里。漏洞是真实存在的，修复成本高昂。在讨论的某个环节，有人会说“我们需要给这个加上安全防护”。问题恰恰出在这句话上：**安全性不是往软件上“添加”的东西，而是从一开始就“构建”到软件内部的东西**。当你开始讨论给一个已经存在的东西添加安全防护时，你已经处于损害控制模式了。


安全源于设计（Secure by Design）是一种截然不同的思维方式：在做出架构决策之前就定义安全需求，在编写第一个类之前就理解威胁模型，在领域层识别并强制执行业务规则。这一切都是工程实践所提供的能力，而不是在已有成果之上叠加的一个层次。CI/CD 流水线捕获人工审查遗漏的问题。系统的每一层都以攻击者的视角来设计——不是作为事后补充，而是作为基础性要求。这不是安全团队的职责，而是工程团队的职责，并且它始于第一个拉取请求之前。


## **“设计上的安全”到底意味着什么**


安全设计不是一份检查清单，也不是一套安装的工具。它是一种思考软件的方式，把安全需求与功能需求同等对待。在这种工作模式下，安全需求必须在系统被视为完成之前得到满足。


大多数团队被动对待安全，出了问题、被标记、打补丁，然后循环往复。系统会像积累其他技术债一样积累安全技术债，只是代价更高。


采用安全设计的团队会主动对待安全。在功能构建之前，工程团队会问：针对此功能的威胁有哪些？哪些数据是敏感的？如果攻击者控制了这个输入会发生什么？如果这个组件被攻破，影响范围有多大？答案决定架构，而不是反过来。


这会产出本质不同的系统。不是因为单个组件不同，而是因为每一层的设计决策都体现了对“可能出错之处”的理解。


典型例子如下：

- API 网关默认启用速率限制，因为设计时已考虑滥用场景。
- 领域层强制执行业务规则，因为设计时已明确这些规则的归属位置。
- CI/CD 流水线能捕获代码中的密钥，因为设计从一开始就包含了这个门禁。

在设计阶段把安全做好的成本，只是事后修复或管理成本的一小部分；而管理成本又只是重大事故成本的一小部分。这只是时间问题！


## 威胁建模：在构建之前理解你的攻击面


威胁建模是在系统构建之前，系统性地识别“可能出错之处”的过程。它是正式的工程活动，而不是安全团队的专属练习。


目标很简单：理解谁可能攻击你的系统、他们想要什么、可能如何获取，以及成功后的影响。有了这些理解，你就能做出有意识的设计决策，降低攻击发生的可能性和影响。


威胁建模的四个问题


**1. 我们在构建什么？**


从映射系统开始。组件有哪些？它们如何通信？数据如何流动？信任边界在哪里——数据从一个信任上下文跨越到另一个的点？


信任边界存在于 API 网关与互联网之间、服务层与数据库之间、系统与第三方集成之间。每一个信任边界都是潜在的攻击面。


你必须绘制数据流，映射数据进入系统、存储、处理以及离开的每一个位置。这能让你完整了解需要保护的对象。


**2. 可能出什么问题？**


针对每个组件和数据流，询问攻击者可以做什么。这里用到 **STRIDE**。这是一组帮助完成此用例的既定问题缩写。

- **欺骗（Spoofing）：** 攻击者能否伪装成他人？能否伪造令牌、冒充用户或声称拥有不属于自己的身份？
- **篡改（Tampering）：** 攻击者能否修改传输中或静态的数据？能否更改交易金额、修改回调载荷或改变已存储记录？
- **抵赖（Repudiation）：** 用户能否否认自己执行过某操作？是否有足够的审计日志证明发生了什么、何时、由谁执行？我们能否证明用户在系统上执行了某操作？
- **信息泄露（Information Disclosure）：** 攻击者能否获知不应知晓的信息？能否读取其他用户数据、从错误响应中提取内部系统信息，或从堆栈跟踪中发现内部基础设施细节？
- **拒绝服务（Denial of Service）：** 攻击者能否阻止合法用户访问系统？能否耗尽资源、触发昂贵操作或以流量压垮系统？
- **权限提升（Elevation of Privilege）：** 攻击者能否获得未授予的权限？普通用户能否访问管理功能，或外部调用者能否触及内部 API？

**3. 我们准备如何应对？**


对每个已识别威胁，我们决定对策：通过降低可能性或影响来缓解；通过使用托管服务来转移；如果风险确实很低且缓解成本过高则接受；通过改变设计使威胁不再适用来消除。


决策必须明确并记录在案，不能是隐含或假设的。必须文档化。


**4. 我们做得足够好吗？**


系统构建完成后，验证对策是否真正落地。威胁建模是一份活文档，而非一次性练习。系统发生变化时，必须重新审视威胁模型。


威胁建模产出什么


威胁模型产出两样真正有价值的东西：一份在系统上线前必须满足的安全需求清单，以及对高风险区域的理解，从而正确聚焦工程精力。


没有威胁模型，安全措施往往被均匀且肤浅地应用。无论实际风险如何，每个组件都得到相同程度的关注。有了威胁模型，你就知道哪些组件是高风险的、哪些数据流是敏感的，以及工程精力应集中在哪里。


## 安全作为业务规则


领域驱动设计（DDD）告诉我们，业务逻辑决定了应用的成败。领域层是定义系统正确性规则的所在地。安全需求本身就是业务规则，它们应与其他业务规则一起位于领域层。


销售代理在未确认覆盖范围的情况下不应能创建销售。这是业务规则。它应位于创建销售的领域实体或领域服务中，在创建时强制执行，上层任何层都无法绕过。


支付不应在未经过处理状态的情况下从待处理直接变为已完成。这是业务规则。它应位于 Payment 实体的状态机中，在实体级别强制执行，无法通过 API 或基础设施层被破坏。


如果源账户被标记为欺诈审查，账户转账不应进行。这既是业务规则，也是安全需求。它应位于编排转账的领域服务中，在任何资金移动之前强制执行。


当安全需求被编码为领域业务规则时，它们无法通过直接调用 API、使用不同客户端或通过 ORM 访问数据库来绕过。规则在领域对象创建或状态变更的点强制执行。系统中的每一条路径都会经过领域层，领域层负责强制执行规则。


值对象进一步强化了这一点。一个在构造时就进行验证的 Money 值对象，意味着领域中永远不会存在无效金额。一个验证格式和校验位的 AccountNumber 值对象，意味着畸形账号无法进入系统。验证不是可被跳过的控制器检查，而是类型本身的内在属性。


这就是领域层面安全设计的工程机制：将安全需求编码为领域类型与领域操作的约束，并使其无法被绕过。


## 加密标准：组织级决策


大多数组织中最危险的安全决策之一，恰恰是那个**没有做出的决策**：组织使用什么加密标准？


没有组织标准时，每个开发者都会自行选择。一个团队用 AES-128，另一个用 AES-256 + CBC 模式，第三个用 AES-256 + GCM 模式，第四个还在某些地方使用 MD5。


没人有意让这种情况发生。它发生是因为没有人在组织层面做出决策并强制执行。


临时加密选择带来的漏洞严重且往往隐蔽。填充预言机攻击利用了特定密码模式与错误处理的组合。IV 生成不当的 CBC 模式容易受到 GCM 模式不会遭受的攻击。弱密钥长度可被暴力破解。加密失败时暴露堆栈跟踪会泄露有助于攻击者的内部实现细节。


每个处理敏感数据的组织都必须明确做出这些决策，并将其作为工程标准强制执行：


1. 使用哪种对称加密算法与模式？


对称加密使用同一密钥加密和解密数据。它快速高效，适合对静态或传输中的大量数据进行加密。


**AES-256 + GCM 模式**是当前大多数应用的标准。AES 是高级加密标准。256 指密钥长度（位）：通常密钥越长，可能组合越多，暴力破解越难。


GCM（Galois/Counter 模式）提供认证加密，即同时加密数据并生成可检测密文是否被篡改的认证标签。一次操作即可获得机密性与完整性。


CBC（密码块链接）模式仍在使用，但需要仔细处理初始化向量（IV）和消息认证码（MAC）才能达到 GCM 原生提供的属性。处理不当会打开填充预言机攻击的大门，攻击者可通过仔细观察系统对修改后密文的响应来解密数据或伪造密文。


2. 密码使用哪种哈希算法？


哈希是单向操作。无法将哈希还原为原始值。因此你存储的是密码的哈希，而不是密码本身。用户登录时，你对输入进行哈希并与存储的哈希比较。


**bcrypt、scrypt 和 Argon2**是当前密码哈希的标准。这些算法刻意设计得缓慢且计算成本高，即使攻击者获得哈希数据库，暴力破解也不切实际。


**SHA-256 不是密码哈希算法。** 它是通用加密哈希函数，设计上追求快速……而这恰恰是密码场景不需要的。攻击者在现代硬件上每秒可尝试数十亿次 SHA-256 哈希。


**MD5 不适合任何敏感场景的哈希。** 它多年前已被破解，绝不应出现在任何安全敏感上下文中。这些并非个人意见，而是密码学研究与真实攻击的结果。


3. 签名与密钥交换使用哪种非对称算法？


非对称加密使用一对密钥：任何人可见的公钥和仅自己持有的私钥。用公钥加密的数据只能用私钥解密。用私钥创建的签名可由持有公钥的任何人验证。


非对称操作至少使用 **RSA-2048**。高安全场景的 JWT 签名使用 **RS256 或 ES256**。RS256 使用 RSA + SHA-256 进行签名。ES256 使用椭圆曲线数字签名算法（ECDSA）与 P-256 曲线。在同等安全级别下，EC 密钥通常优于 RSA，因为它们产生更小的密钥和签名，同时提供相同的密码学强度。


4. 如何将加密交付给开发者


最重要的决策是：不要在每个项目中从零实现加密。高级工程师将加密工具构建为内部包或云函数，然后直接导入使用。你永远不应自己编写密码学原语。这从源头消除了整整一类实现失败。


当加密实现集中化时，修复漏洞只需在一个地方修改。当它分散在每个项目中时，修复漏洞首先要找到每一个实现，这往往不可能。


## 数据库安全


数据库是大多数系统中最敏感数据的所在地，也是整个技术栈中最常被错误配置的组件之一。


SQL 注入


SQL 注入已有 25 年历史，自 1998 年就存在。它仍出现在生产系统中，是因为工程标准未得到强制执行。


原因始终相同：字符串拼接。开发者将用户输入直接拼接到 SQL 字符串中。数据库无法区分开发者意图的查询与攻击者构造的查询。


```plain text
-- 开发者意图
SELECT * FROM usersWHERE email= 'user@example.com'

-- 攻击者传入：anything@example.com' OR '1'='1
SELECT * FROM usersWHERE email= 'anything@example.com' OR '1'='1'
-- 返回表中所有用户
```


修复方法始终是参数化查询或 ORM。查询结构固定，值单独传递。数据库将它们视为数据，而非查询结构的一部分。


CI/CD 流水线中的静态分析必须标记原始 SQL 字符串拼接。这是零容忍政策。带有用户输入拼接的原始 SQL 字符串永远不可接受，绝不能进入生产环境。


数据库访问的最小权限原则


应用的数据库用户应仅拥有所需权限，不多不少。只读报表端点应以仅有 SELECT 权限的用户连接，不应有 INSERT、UPDATE 或 DELETE。仅写入的 API 不应有 DROP TABLE 权限。


这限制了成功的 SQL 注入或凭证泄露的影响范围。如果应用只能从特定表 SELECT，攻击者即使获取数据库凭证也只能 SELECT 这些表，无法 DROP 数据库、插入虚假记录或更新账户余额。


这是一个必须为每个应用组件明确做出的数据库配置决策，并在基础设施层面强制执行。


所有数据库连接必须加密


数据库连接必须使用 TLS。未加密的数据库连接会在网络上以明文传输查询结果。应用与数据库之间任何能观察网络流量的组件都能读取每一个查询结果。


在云环境中，服务常通过看似安全实则不然的内部网络通信。加密数据库连接不是可选项。


以下是在数据库连接上强制执行 TLS 的实际情况：


```dart
final connection = await Connection.open(
  Endpoint(
    host: 'your-db-host.example.com',
    port: 5432,
    database: 'your_database',
    username: dbUser,
    password: dbPassword,
  ),
  settings: ConnectionSettings(
    sslMode: SslMode.require,
  ),
);
```


```c#
var connectionString =
    "Host=your-db-host.example.com;" +
    "Port=5432;" +
    "Database=your_database;" +
    "Username=db_user;" +
    "Password=db_password;" +
    "SSL Mode=Require;" +
    "Trust Server Certificate=false;";

await using var dataSource = NpgsqlDataSource.Create(connectionString);
```


设置 SSL Mode=Require 意味着如果数据库服务器不支持 TLS，连接将完全失败。这是正确的姿态。当 TLS 不可用时静默回退到明文的连接，完全不提供保护。


数据库凭证必须存放在密钥库中


数据库凭证必须在运行时从密钥管理器获取，不能存储在配置文件中、提交到版本控制，或硬编码在连接字符串中。


运行时凭证获取的实际工作方式如下：


```dart
final dbHost = Platform.environment['DB_HOST']!;
final dbUser = Platform.environment['DB_USER']!;
final dbPassword = Platform.environment['DB_PASSWORD']!;

final connection = await Connection.open(
  Endpoint(
    host: dbHost,
    database: 'your_database',
    username: dbUser,
    password: dbPassword,
  ),
  settings: ConnectionSettings(sslMode: SslMode.require),
);
```


```c#
builder.Configuration.AddAzureKeyVault(
    new Uri("https://your-vault.vault.azure.net/"),
    new DefaultAzureCredential()
);

var connectionString = builder.Configuration["DatabaseConnectionString"];
```


连接池也必须妥善控制。无限制的连接池会耗尽数据库服务器的可用连接，导致所有租户无法使用。必须有意配置池大小：


```c#
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.ConnectionStringBuilder.MaxPoolSize = 20;
dataSourceBuilder.ConnectionStringBuilder.MinPoolSize = 5;
dataSourceBuilder.ConnectionStringBuilder.ConnectionIdleLifetime = 300;
await using var dataSource = dataSourceBuilder.Build();
```


存储过程作为参数化策略


存储过程是存储在数据库内部的命名预编译 SQL 块。应用不再发送完整 SQL 字符串，而是按名称调用过程并单独传递参数。


由于 SQL 结构固定在数据库内部，参数始终被视为数据（永不拼接到查询字符串），存储过程对 SQL 注入具有抗性。


```sql
CREATE OR REPLACE PROCEDURE get_user_by_email(p_email VARCHAR(255))
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT id, first_name, last_name, email
    FROM users
    WHERE email = p_email;
END;
$$;
```


```c#
public async Task<User?> FindUserByEmail(string email)
{
    await using var command = dataSource.CreateCommand("get_user_by_email");
    command.CommandType = CommandType.StoredProcedure;
    command.Parameters.AddWithValue("p_email", email);

    await using var reader = await command.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        return new User
        {
            Id = reader.GetGuid(0),
            FirstName = reader.GetString(1),
            LastName = reader.GetString(2),
            Email = reader.GetString(3)
        };
    }
    return null;
}
```


攻击者传入 ' OR '1'='1 作为邮箱值时，得到的就是该字符串作为参数。数据库绝不会将其解释为 SQL 语法。过程仅执行创建时定义的固定查询。这也是存储过程仍是合法安全工具（而不仅仅是性能优化）的原因之一。


## CORS：API 强制执行的边界


跨源资源共享（CORS）是浏览器安全机制，控制哪些域名可以从网页向你的 API 发起请求。


生产环境中最常见也最危险的 CORS 错误配置是通配符 CORS：


```plain text
Access-Control-Allow-Origin: *
```


这告诉每个浏览器：整个互联网上的任何网页都可以使用该用户的凭证向你的 API 发起认证请求。攻击者托管恶意网页，用户访问后，攻击者的页面就能以该用户身份请求你的 API。


开发环境中通配符 CORS 很方便，生产环境中则是漏洞。


每个生产 API 必须配置明确的允许源，而非通配符模式，也不是 *.yourapp.com。必须是明确枚举的、允许发起跨源请求的域名。


```plain text
Access-Control-Allow-Origin: https://app.yourproduct.com
Access-Control-Allow-Origin: https://admin.yourproduct.com
```


域名匹配必须精确。如果 Origin 头与明确允许的源不匹配，浏览器将不包含响应。


允许的方法和允许的头也必须明确。默认拒绝姿态适用：未明确允许的就不允许。


这是在 API 网关或框架层面做出的配置决策。它统一应用于所有 API 端点，而不是由单个开发者在每个端点上可能错误配置。


## 结构化日志与字段级掩码


日志是大多数系统中最被忽视的安全面之一。开发者为调试添加日志语句。这些日志语句流向日志平台。日志平台会保留数月甚至数年。日志中包含开发者在事故凌晨 11 点调试时认为有用的任何内容。


结果是生产日志经常包含不应共享的信息。例如完整的请求与响应体、带有 Bearer 令牌的授权头、与敏感操作配对的用户 ID、账号，有时甚至是明文密码（因为有人在验证运行前记录了原始请求体）。


再次强调，这并非假设。这些是真实生产日志平台中发现的真实模式。


工程控制是在日志框架层面应用字段级掩码。敏感字段在日志配置中一次性定义。框架会在每个环境的每一条日志语句中自动掩码这些字段，无论开发者在日志中放入什么。


绝不能出现在日志中的敏感字段包括：密码、令牌与授权头、完整账号与卡号、BVN 与 NIN、任何国家标识符、加密密钥与秘密，以及处理敏感数据端点的完整请求体。


掩码必须是框架级的，而非开发者级的。添加日志语句时，你无需记得掩码敏感字段。框架会处理。你只需记录对调试有用的内容。框架会生成敏感字段被替换为掩码值的日志条目。


以下是现场层面的掩蔽实践：


```dart
class SecureLogger {
  final Logger _logger;

  static const _sensitiveKeys = {
    'password', 'authorization', 'token',
    'account_number', 'card_number', 'bvn', 'nin', 'secret', 'api_key',
  };

  SecureLogger(this._logger);

  void info(String message, {Map<String, dynamic>? data}) {
    _logger.info(message, _mask(data));
  }

  void error(String message, {Map<String, dynamic>? data, Object? error}) {
    _logger.error(message, _mask(data), error);
  }

  Map<String, dynamic>? _mask(Map<String, dynamic>? data) {
    if (data == null) return null;
    return data.map((key, value) {
      if (_sensitiveKeys.contains(key.toLowerCase())) {
        return MapEntry(key, '***MASKED***');
      }
      if (value is Map<String, dynamic>) return MapEntry(key, _mask(value));
      return MapEntry(key, value);
    });
  }
}

final logger = SecureLogger(Logger('PaymentService'));

logger.info('Processing payment', data: {
  'transaction_id': 'txn_001',
  'amount': 50000,
  'account_number': '0123456789',
  'authorization': 'Bearer eyJ...',
});

// output:
// Processing payment
// { transaction_id: txn_001, amount: 50000,
//   account_number: ***MASKED***, authorization: ***MASKED*** }
```


```c#
public class MaskSensitiveFieldsPolicy : IDestructuringPolicy
{
    private static readonly HashSet<string> SensitiveFields =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "password", "authorization", "token", "account_number",
            "card_number", "bvn", "nin", "secret", "api_key"
        };

    public bool TryDestructure(
        object value,
        ILogEventPropertyValueFactory factory,
        out LogEventPropertyValue result)
    {
        if (value is not IDictionary<string, object> dict)
        {
            result = null!;
            return false;
        }

        var properties = dict.Select(kvp => new LogEventProperty(
            kvp.Key,
            SensitiveFields.Contains(kvp.Key)
                ? factory.CreatePropertyValue("***MASKED***")
                : factory.CreatePropertyValue(kvp.Value, true)));

        result = new StructureValue(properties);
        return true;
    }
}

Log.Logger = new LoggerConfiguration()
    .Destructure.With<MaskSensitiveFieldsPolicy>()
    .WriteTo.Console()
    .CreateLogger();
```


这适用于每一个环境，无一例外，而不仅限于生产。开发日志经常被导出到第三方日志平台，并由多名团队成员搜索。在开发中针对真实账户测试并记录请求体的开发者，已经把真实用户数据放入了不属于它的日志平台。


## CI/CD 安全关卡


CI/CD 流水线是代码进入生产前的最后一道自动化关卡，也是大多数工程组织中最持续被低估的安全控制之一。


大多数流水线运行测试并检查格式。安全关卡是额外的检查，用于捕获人工代码审查持续遗漏的安全相关问题。


密钥检测


每一次推送到每一个分支都必须扫描密钥。包括 API 密钥、数据库密码、私钥、嵌入凭证的连接字符串，以及配置文件中的 JWT 秘密。


**Gitleaks** 是专为此目的构建的免费开源工具。以下是如何将其集成到 GitHub Actions 流水线中的方法：


```yaml
# .github/workflows/security.yml
name: Security Gates

on:
  push:
    branches: ["*"]
  pull_request:
    branches: ["*"]

jobs:
  secret-detection:
    name: Scan for secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


当 Gitleaks 发现密钥时，它会使流水线失败，输出确切文件与行号，并阻止合并。你需要移除密钥、轮换凭证（因为已接触版本控制，必须视为已泄露），并推送干净提交后流水线才能通过。


扫描必须覆盖完整 Git 历史，而非仅最新提交。三提交前添加并在下一提交移除的密钥仍存在于仓库历史中，应视为已泄露。


组织还应有明确的响应流程：密钥被检测时通知谁、轮换哪些凭证、在什么时间框架内。只有检测没有响应，就不算安全控制。


安全静态分析


静态分析工具在不运行代码的情况下分析漏洞模式。它们能捕获原始 SQL 字符串拼接、不安全的反序列化、硬编码凭证、已弃用的密码学函数、缺失的输入验证以及危险函数调用。


**Semgrep** 是免费开源静态分析工具，拥有由安全社区维护的大量安全规则库。以下是它在流程中的作用：


```yaml
static-analysis:
    name: Static analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/secrets
            p/sql-injection
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```


p/owasp-top-ten 规则集捕获对应 OWASP Top 10 漏洞的模式。p/sql-injection 规则集专门标记数据库查询中的字符串拼接。当 Semgrep 找到匹配时，流水线失败并标识触发的确切文件、行与规则。代码在问题解决前无法合并。


对于 .NET 项目，**Microsoft Security Code Analysis** 和 **Roslyn Analyzers** 提供类似能力，直接集成到构建过程中。


规则必须有意配置。并非每个警告都代表实际漏洞。团队需定义哪些规则是阻塞性的、哪些是建议性的、哪些被抑制。这一配置本身就是安全决策，必须定期审查。


依赖漏洞扫描


项目中的每一个依赖都是潜在攻击面。**OWASP Dependency-Check** 是免费工具，可对照国家漏洞数据库（NVD）扫描项目依赖并标记已知 CVE。


```yaml
dependency-scan:
    name: Dependency vulnerability scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "your-project-name"
          path: "."
          format: "HTML"
          args: >
            --failOnCVSS 7
            --enableRetired

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: dependency-check-report
          path: reports/
```

- -failOnCVSS 7 标志意味着如果任何依赖存在 CVSS 评分 7 或更高的已知漏洞，流水线将失败。CVSS（通用漏洞评分系统）评分范围 0 到 10。7 分及以上被视为高严重性。你可根据风险承受能力调整此阈值。

对于 Node.js 项目，npm audit 开箱即用提供类似功能。对于 Dart 项目，dart pub deps 结合漏洞数据库检查可覆盖依赖面。


### 环境特定配置验证


部署到生产之前，流水线必须验证生产配置满足所需安全标准。这不仅仅是检查配置文件是否存在，而是主动断言特定安全关键设置是否正确。


```yaml
config-validation:
    name: Validate production configuration
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Validate security configuration
        run: |
          if grep -r "debugEndpoint\|swagger-ui\|/debug" src/ --include="*.dart" --include="*.cs"; then
            echo "ERROR: Debug endpoints found in production build"
            exit 1
          fi

          if grep -r "AllowAnyOrigin\|\*" config/ --include="*.yaml" --include="*.json"; then
            echo "ERROR: Wildcard CORS configuration detected"
            exit 1
          fi

          if grep -rE "(password|secret|key)\s*=\s*['\"][^$\{]" config/ --include="*.yaml" --include="*.json"; then
            echo "ERROR: Hardcoded credentials detected in configuration"
            exit 1
          fi

          if grep -r "showStackTrace.*true\|expose_errors.*true" config/ --include="*.yaml"; then
            echo "ERROR: Stack trace exposure enabled in production config"
            exit 1
          fi
```


此脚本在每次生产部署前运行。调试端点、通配符 CORS、硬编码凭证和堆栈跟踪暴露均为阻塞性失败。部署在所有检查通过前无法继续。


### 不同环境使用不同工作流


开发、预发与生产必须有不同的流水线工作流。不仅是部署目标不同，验证要求也不同。生产流水线比预发更严格，预发比开发更严格。


生产流水线包含完整安全关卡。开发流水线可跳过部分运行时间较长的关卡以保持开发者速度。但生产流水线绝不能跳过。


这种分层方法意味着代码在接近生产时逐步通过更严格的安全验证。当它到达生产部署关卡时，已在较低环境中通过多层自动化安全验证。


## 微服务与内部服务安全


构建微服务引入了单体架构没有的安全挑战：每一次服务间通信都是潜在攻击面。


在单体中，组件间方法调用是内存中的函数调用，无法在传输中被拦截、伪造或篡改。


在微服务架构中，每一次服务调用都是网络请求。网络请求可被拦截、伪造和篡改。因为“内部”而隐式信任彼此的服务，正在做出危险假设。


每个微服务必须默认将入站请求视为不可信，包括来自其他内部服务的请求。每一次服务间通信都需要认证。API 网关处理外部认证。内部服务间认证必须单独处理。


两种模式覆盖主要场景：同步调用使用 mTLS，异步通信使用认证事件流。


**同步服务间调用的 mTLS**（双向 TLS）意味着双方服务互相呈现证书。Payment 服务调用 Account 服务时必须呈现 Account 服务信任的有效证书。证书缺失或无效时，连接在任何应用代码运行前被拒绝。这是身份的密码学证明：没有可窃取的 Bearer 令牌，也没有需要轮换的 API 密钥。


```plain text
支付服务（Payment Service）                账户服务（Account Service）
      |                                  |
      |-- 出示其证书 -------------------> |
      |                                  |-- 依据受信任的证书颁发机构（CA）验证证书
      |                                  |-- 证书无效则拒绝连接
      | <-- 出示其证书 ------------------ |
      |-- 验证证书                       |
      |                                  |
      |-- 已认证的请求 -----------------> |
      |                                  |-- 因身份已获证明而处理请求
```


**异步通信的认证事件流**意味着发布到代理的每一条消息都携带签名，消费服务在处理前验证。发布 PaymentCompleted 事件的服务用其私钥签名。消费服务在对事件采取行动前验证签名。无有效签名的伪造事件被丢弃。


```dart
class PaymentEventPublisher {
  final KafkaProducer _producer;
  final EventSigner _signer;

  Future<void> publishPaymentCompleted(Payment payment) async {
    final event = PaymentCompletedEvent(
      paymentId: payment.id,
      amount: payment.amount,
      timestamp: DateTime.now().toIso8601String(),
    );

    final signature = await _signer.sign(jsonEncode(event.toJson()));

    await _producer.send(
      topic: 'payment.completed',
      value: jsonEncode({
        'payload': event.toJson(),
        'signature': signature,
        'publisher': 'payment-service',
      }),
    );
  }
}

class AccountEventConsumer {
  final EventVerifier _verifier;
  final AccountService _accountService;

  Future<void> onMessage(KafkaMessage message) async {
    final data = jsonDecode(message.value);
    final isValid = await _verifier.verify(
      jsonEncode(data['payload']),
      data['signature'] as String,
      data['publisher'] as String,
    );

    if (!isValid) {
      logger.warning('Invalid signature from ${data['publisher']} — discarding');
      return;
    }

    final event = PaymentCompletedEvent.fromJson(data['payload']);
    await _accountService.handlePaymentCompleted(event);
  }
}
```


服务不得在不经过 API 网关的情况下直接从互联网访问。网关是唯一入口。它处理所有外部流量的速率限制、认证与路由。网关后的服务是内部的：它们彼此仍不可信，但不对外暴露。


过度工程本身就是安全风险。本应是设计良好的单体却被实现为微服务的应用，会引入团队无力管理的运维复杂度。多条部署流水线、多个服务边界、API 网关、消息代理与分布式追踪都需要专门的工程能力才能安全运行。一个没有足够资源正确维护的单体，远比一个完全没有资源运行的微服务架构危险。


根据团队实际能安全运维的能力选择架构，而不是根据潮流。


## 数据隐私与合规作为工程需求


数据隐私需求是工程需求。它们不是工程去迁就的法律需求，而是工程必须拥有的工程需求。


根据尼日利亚 NDPA 2023，个人数据只能为指定、明确且合法的目的处理。BVN 数据有 CBN 指南强制执行的特定驻与处理要求。根据 PCI-DSS，任何存储、处理或传输持卡人数据的环境都属于合规范围。


这些需求有具体的工程影响。


1. 数据最小化


你只能收集和存储指定目的实际需要的个人数据。收集超出需要数据的 API 会制造合规风险。返回超出调用者需要数据的响应既是 BOPLA 漏洞，也是数据最小化违规。


2. 目的限制


为一个目的收集的数据，在没有适当依据的情况下不得用于不同目的。工程含义是：系统内流动的数据必须文档化并强制执行。一个服务的数据不得流向将其用于未授权目的的另一个服务。


3. 数据驻留


某些类别的数据必须存储在特定地理区域。这是必须设计进系统架构的基础设施要求，而非部署后补丁。


4. 保留与删除


当收集目的已实现，或隐私声明中定义的保留期限到期时，个人数据必须被删除。工程含义是：每一类个人数据都必须有明确的保留策略和自动化删除机制。依赖某人记得去删除数据的手动删除策略不符合合规要求。


5. 审计日志


每一次对个人数据的访问都必须记录足够细节以证明合规。谁在何时、以何种声明目的访问了什么数据。此审计日志必须防篡改，并按要求期限保留。


这一个服务以可运行代码演示了全部五项合规策略。每一次访问都声明目的。返回数据前验证数据驻留。审计日志捕获每一次访问的完整上下文。响应只返回所需字段。定时任务自动强制执行删除，无需任何人记得。


这些需求必须成为每一个处理个人数据功能的需求规格的一部分。不是功能构建后再处理，而是在设计中处理。


## 结论


安全不是事后添加到软件中的功能，而是从一开始就工程化进去的属性。


在架构决策之前进行威胁建模，意味着你在决定如何构建之前就理解自己在保护什么、以及对抗什么。


安全作为业务规则，意味着领域层以强制执行任何其他业务规则的方式强制执行安全需求——无法绕过，也无法遗忘。


加密标准作为组织决策，意味着没有开发者会凭偏好或便利选择密码学原语。


数据库安全意味着应用只能做它需要做的事，攻击者即使攻破一个组件也无法攻破一切。


CORS 配置意味着浏览器安全机制真正在强制执行边界，而不是被通配符绕过。


带有字段级掩码的结构化日志意味着无论开发者记录什么，敏感数据都不会进入日志文件。


而 CI/CD 安全关卡意味着自动化验证在每一次推送、每一次部署前捕获人工审查遗漏的问题。


这些都不是奇特或困难的概念。它们是需要有意决策和有意强制执行的工程纪律。不做这些决策本身就是一种决策，其后果会出现在事故报告中。


处理安全漏洞最昂贵的地方是被利用之后。第二昂贵的地方是已上线生产之后。最廉价的地方是设计阶段，在任何一行代码存在之前。


这就是安全设计在实践中的含义。不是完美安全或零风险，而是在系统构建之前，就系统如何处理对抗性条件做出有意、文档化、可强制执行的决策，从而从一开始就让工程扎实。


作为技术爱好者，值得期待的一件事是：应用以安全作为开发过程不可或缺部分的那一天到来。而不是事后补充，或仅仅为了能部署而需要通过的东西。这就是为什么你需要理解、接受并采用安全设计作为标准化流程——不仅在应用安全领域，也在核心软件工程中