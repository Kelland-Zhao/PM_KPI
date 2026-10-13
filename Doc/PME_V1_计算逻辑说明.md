# PME V1 计算逻辑说明

## 1. 文档目的

本文用于统一一线技术员、工程师和主管对 PME（Post-PM Effectiveness，保养后有效性）V1 版本的理解。

本文只说明计算逻辑，不说明表格操作步骤，也不展开异常提示处理。

## 2. V1 的核心原则

PME 的判断必须以正式保养计划为基础，并使用 AEM 的生产数据计算保养前后的表现。

计算链路为：

```text
PM 计划 → 确认保养事件 → AEM 班次数据 → 计算保养前后窗口 → 判断 PME
```

V1 的最终评价只有两类：

- `好/Good`
- `差/Bad`

如果保养后累计 Production Available Time 未达到 144 小时，则该条记录标记为 `未达144`，不进行最终 Good/Bad 评价。

## 3. 保养计划匹配规则

### 3.1 正式保养的筛选条件

正式保养必须来自 PM 计划，并同时满足：

- `类别`字段包含 `PM`；
- `状态`不等于 `取消`；
- 使用计划中的 `开始日期`、`开始时间`、`AEM#`、`保养时间`和`工序`；
- AEM 中单独出现、但 PM 计划中不存在的 PM 数据，不单独认定为正式保养。

### 3.2 工序映射

- PM 计划中的 `INJ` 映射为 `IM`；
- `TF`和`PK`按计划中的工序保留；
- TF 的机型分类使用 `SubProcess`，例如 `AFT & USW`、`HSL & Bou`和`Zar`。

### 3.3 机台号标准化

机台号匹配前，先去除不影响设备身份的后缀，例如：

```text
T2GB0105【SW】 → T2GB0105
```

标准化后的机台号用于 PM 计划与 AEM 数据匹配。

## 4. 不纳入 PME 的设备

以下设备不纳入 PME 计算：

- `S1DP0001`、`S1DP0002`、`S1DP0003`、`S1DP0004`；
- `PK` 工序中机台号以 `PKS` 或 `PKF` 开头的附属设备；
- 已配置在 KPI 排除条件中的特定机台和保养组合。

这些设备不参与 144 小时窗口、AU、UPDT 或 PME 结果计算。

## 5. 班次顺序和保养窗口

AEM 班次编号固定解释为：

- `1 = 夜班`
- `2 = 早班`
- `3 = 中班`

班次排序必须按“日期 + 班次实际顺序”建立，不能把班次编号直接当作自然日顺序。

### 5.1 保养开始时间

保养开始时间以 PM 计划为准：

- 计划有开始时间时，使用计划开始时间；
- 只有开始日期、没有开始时间时，默认从当天早班 08:00 开始；
- 保养持续时间按每班 8 小时换算为连续班次数。

### 5.2 保养后窗口起点

保养后窗口从计划保养结束后的第一个完整生产班次开始。

保养持续期间的班次不计入 AFTER PM 的 Production Available Time。

如果保养从早班开始持续 4 个班次，则第 5 个班次才是 AFTER PM 的第一个班次。

## 6. IM（注塑）特殊规则

### 6.1 保养前生产班次轮空

IM 在计算 BEFORE PM 时，不是固定轮空某个自然日班次，而是基于 AEM 的生产班次记录识别保养前的生产边界。

原因是设备在保养前停机或准备停机时，结存可能在停机前最后一个生产班次一次性提交，导致该班次的 `Prod_Hours` 与实际生产节奏不匹配，进而使 `UPDT_BEFORE` 失真。

处理规则如下：

- 以 PM 计划开始班次为截止点，向前查找保养前的 AEM 班次；
- 连续生产时，轮空保养前最后一个 `Prod_Hours > 0` 的生产班次；
- 如果保养前存在多次停开，则对每个“生产班次后紧接 `Prod_Hours = 0` 空班”的停机边界，轮空该空班之前的生产班次；
- `Prod_Hours = 0` 的空班本身不增加 144 小时累计，也不作为需要单独轮空的生产班次；
- 未被轮空的有效生产班次，才用于计算 BEFORE PM 的累计 `Production Available Time` 和 `UPDT_BEFORE`；
- AFTER PM 仍按正常规则，从保养结束后的第一个完整生产班次开始累计。

### 6.2 IM 示例

假设某注塑机：

- PM 计划从 1 月 21 日早班开始；
- 保养持续 4 个班次；
- 保养结束于 1 月 22 日早班结束；
- AFTER PM 从 1 月 22 日中班开始。

窗口处理如下：

```text
保养前最后一个 Prod_Hours>0 班次 → 轮空，不用于 BEFORE PM
更早的“生产班次→Prod_Hours=0”边界 → 轮空该空班之前的生产班次
其他未被轮空的有效生产班次       → 用于 BEFORE PM，累计至达到计算需要
1月21日早班至1月22日早班         → 保养期间，不用于 AFTER PM
1月22日中班及以后班次             → 用于 AFTER PM，并累计至 ≥144h
```

## 7. TF 特殊规则

### 7.1 CO 大于 0 的 AFTER PM 分段轮空

AEM 中一个班次可能按多个产品或生产分段拆成多条记录。因此，TF 的 `CO` 判断按 AEM 分段记录执行，而不是按整班执行：

- 某条 AEM 分段记录 `CO > 0`：仅轮空该条分段记录；
- 该分段记录的 `Prod_Hours` 不计入 144 小时累计；
- 该分段记录的 `NetRuntime`、`PlantAvailableTime` 和相关数据不用于 AFTER PM 评价；
- 同一班次内其他 `CO = 0` 的分段记录仍然保留并计入；
- 不能因为一个分段 `CO > 0`，就把同一班次的全部分段整班剔除。

在保留有效分段后，继续按日期和班次顺序累计 `Prod_Hours`，直到达到 144 小时。

达到 144 小时的班次需要计入，即使累计结果大于 144 小时，也不要求刚好等于 144 小时。

### 7.2 TF 示例

假设 TF 某机台保养结束后，同一班次被 AEM 拆成以下分段：

| 班次 | 分段 | CO | Prod_Hours | 是否计入累计 |
|---|---:|---:|---|---:|
| 第1班 | A | 0 | 5 | 计入 |
| 第1班 | B | 0.5 | 3 | 轮空 |
| 第1班 | C | 0 | 2 | 计入 |
| 第2班 | A | 0 | 8 | 计入 |
| …… | …… | …… | …… | …… |
| 达到阈值的分段 | …… | 0 | …… | 计入 |

第1班的 B 分段因为 `CO > 0` 被剔除，但第1班的 A、C 分段仍计入。计算继续向后延伸，直到有效分段累计值达到 144 小时。

## 8. 144 小时判定

### 8.1 Production Available Time

AEM 字段映射如下：

```text
Prod_Hours = Production_AvailableTime
```

对 AFTER PM 窗口中的有效班次累加 `Prod_Hours`：

```text
累计 Production Available Time
= 有效班次 Prod_Hours 之和
```

规则：

- `Prod_Hours = 0` 的班次不会增加累计值；
- 累计值第一次达到或超过 144 小时的班次必须纳入；
- 不要求累计值刚好等于 144 小时；
- 如果截至数据截止日仍未达到 144 小时，状态为 `未达144`。

### 8.2 生产状态

```text
AFTER PM 累计 Prod_Hours ≥ 144 → 生产
AFTER PM 累计 Prod_Hours < 144 → 未达144
```

只有状态为 `生产` 的记录才进入最终 PME Good/Bad 评价。

## 9. KPI 计算公式

所有窗口先汇总原始时间，再计算比率，不直接平均每个班次的百分比。

### 9.1 AU

```text
AU = NetRuntime / PlantAvailableTime
```

分别计算：

- `AU_BEFORE PM`
- `AU_AFTER PM`

### 9.2 UPDT

```text
UPDT = 1 - NetRuntime / Prod_Hours
```

分别计算：

- `UPDT_BEFORE PM`
- `UPDT_AFTER PM`

不能用 `1 - AU` 替代 UPDT，因为 AU 和 UPDT 的分母不同：

- AU 使用 `PlantAvailableTime`；
- UPDT 使用 `Prod_Hours`。

### 9.3 UPDT Gap

```text
UPDT Gap = UPDT_AFTER PM - UPDT_BEFORE PM
```

### 9.4 绩效状态

```text
UPDT_AFTER PM ≤ UPDT_BEFORE PM → 好/Good
UPDT_AFTER PM > UPDT_BEFORE PM → 差/Bad
```

由于 PME 目标是保养后 UPDT 不上升，因此 UPDT_AFTER 越低，结果越好。

## 10. 保养月份归属

PME 的 `YearMonth` 按 PM 计划开始日期的“20 日切点”确定，而不是简单按自然月取值：

- PM 计划开始日期为当月 1–20 日：归属当月；
- PM 计划开始日期为当月 21 日至月末：归属下个月。

代码实现为：当日期大于 20 日时，在日期上加 11 天后取 `yyyyMM`；日期不大于 20 日时，直接取 PM 日期的 `yyyyMM`。因此该规则的业务含义就是“每月 20 日关账，21 日起计入下月”。

例如：

```text
PM 计划开始日期 = 2026-09-20 → YearMonth = 202609
PM 计划开始日期 = 2026-09-21 → YearMonth = 202610
PM 计划开始日期 = 2026-09-26 → YearMonth = 202610
```

不根据：

- 首次达到 144 小时的日期；
- AFTER PM 窗口结束日期；
- 数据最终读取日期；

重新调整 `YearMonth`。

因此，2026-09-26 的 H2HTA653 保养虽然 PM 日期在 9 月，但保养归属月份是 `202610`，不是 `202609`。

注意：PM 计划表中的“月份”字段可以仍显示自然月 `202609`；PME 统计使用的是按上述 20 日切点生成的 `YearMonth`，两者不是同一个字段，不能直接混用。

## 11. V1 结果字段含义

| 字段 | 含义 |
|---|---|
| `Production_AvailableTime_BEFORE PM` | IM 排除保养前最后一个班次后的 BEFORE PM 累计 Prod_Hours |
| `Production_AvailableTime_AFTER PM` | 按 V1 规则累计至首次达到或超过 144 小时的 AFTER PM Prod_Hours |
| `AU_BEFORE PM` / `AU_AFTER PM` | 保养前后 AU |
| `UPDT_BEFORE PM` / `UPDT_AFTER PM` | 保养前后 UPDT |
| `UPDT Gap` | AFTER UPDT 减 BEFORE UPDT |
| `YearMonth` | 按 PM 计划开始日期的 20 日切点确定：1–20 日归当月，21 日至月末归下个月 |
| `SubProcess` | 工序下的机型分类；TF 使用机型映射 |
| `Production Status` | 是否达到 AFTER PM 144 小时 |
| `Performance Status` | UPDT 前后比较后的最终 Good/Bad 评价 |

## 12. 最终判定顺序

每条保养按以下顺序处理：

1. 读取正式 PM 计划并确认工序、日期、机台号和保养时长；
2. 标准化机台号并匹配 AEM；
3. 按班次顺序确定保养前后窗口；
4. 应用 IM 或 TF 的轮空规则；
5. 累计 AFTER PM 的 `Prod_Hours`，直到达到或超过 144 小时；
6. 计算 BEFORE/AFTER 的 AU 和 UPDT；
7. 先判断是否达到 144 小时；
8. 达到 144 小时后，再根据 UPDT 前后变化给出 `好/Good` 或 `差/Bad`；
9. 按 PM 计划开始日期的 20 日切点归属 `YearMonth`。
