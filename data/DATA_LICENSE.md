# 数据说明与许可归属

本目录包含来自 NYC DOHMH、NYC Parks、NYC DCP、US Census Bureau 和 OpenStreetMap 的处理后数据及研究结果。

- OSM 路网和依赖该路网的派生数据库成分按 Open Data Commons Open Database License 1.0 提供。© OpenStreetMap contributors。许可：https://opendatacommons.org/licenses/odbl/1-0/ ；署名说明：https://www.openstreetmap.org/copyright 。
- NYC 数据遵守官方数据门户及提供机构条款：https://data.cityofnewyork.us/stories/s/Terms-of-Use/k9k7-3cje/ 。
- NYC DOHMH 原始 HVI 仓库附有 Apache-2.0 许可：https://github.com/nychealth/EHDP-data 。
- 人口数据来源为 US Census Bureau 的 Census2020 TIGERweb 服务。

原始来源链接、下载时间和文件哈希保存在 dataset.json 的 metadata.source_manifest。处理过程见 scripts/build_data.py；模型假设与局限见项目报告及 DATA_SOURCES.md。

仓库根目录 MIT LICENSE 仅涵盖原创代码，不能用于重新许可第三方原始数据。此项目不代表上述机构背书。
