/**
 * 도메인 TypeScript 인터페이스로부터 OpenAPI 컴포넌트 스키마를 자동 생성한다.
 *
 * 실행: yarn build:schema
 * 출력: src/swagger-schemas.json
 *
 * 도메인 인터페이스가 변경되면 이 스크립트를 재실행하여 스키마를 갱신한다.
 */
import fs from 'fs';
import path from 'path';
import { createGenerator } from 'ts-json-schema-generator';

/** 도메인 타입명 → OpenAPI 스키마명 매핑 (이름이 다른 경우만 명시) */
const RENAME_MAP: Record<string, string> = {
  ImageDomain: 'ImageInfo',
  FlayHistory: 'History',
};

/** 생성 대상 도메인 타입 목록 */
const TARGET_TYPES = ['Tag', 'Video', 'Flay', 'FlayFiles', 'FullyFlay', 'FlayCondition', 'Actress', 'TagGroup', 'Studio', 'FlayHistory', 'Diary', 'DiaryMeta', 'ImageDomain'];

const generator = createGenerator({
  path: path.resolve(__dirname, '../src/domain/index.ts'),
  tsconfig: path.resolve(__dirname, '../tsconfig.json'),
  skipTypeCheck: true,
  expose: 'export',
  topRef: false,
});

/**
 * JSON Schema $ref 경로를 OpenAPI 3.0 형식으로 변환하고, 이름 매핑을 적용한다.
 * #/definitions/Tag → #/components/schemas/Tag
 * #/definitions/ImageDomain → #/components/schemas/ImageInfo
 */
function toOpenAPI(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toOpenAPI);

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$schema') continue;
    if (key === 'additionalProperties' && value === false) continue;
    if (key === '$ref' && typeof value === 'string') {
      let ref = value.replace('#/definitions/', '#/components/schemas/');
      for (const [from, to] of Object.entries(RENAME_MAP)) {
        ref = ref.replace(`/schemas/${from}`, `/schemas/${to}`);
      }
      result[key] = ref;
    } else {
      result[key] = toOpenAPI(value);
    }
  }
  return result;
}

// 각 타입을 개별 생성하여 최상위 스키마와 참조 definitions를 모두 수집
const schemas: Record<string, any> = {};

for (const typeName of TARGET_TYPES) {
  const schemaName = RENAME_MAP[typeName] || typeName;
  try {
    const typeSchema = generator.createSchema(typeName);
    // $schema, definitions 제거 후 본체만 추출
    const { $schema, definitions: defs, ...body } = typeSchema;
    schemas[schemaName] = toOpenAPI(body);
    // 참조 definitions도 schemas에 병합
    if (defs) {
      for (const [defName, defSchema] of Object.entries(defs)) {
        const mappedName = RENAME_MAP[defName] || defName;
        if (!schemas[mappedName]) {
          schemas[mappedName] = toOpenAPI(defSchema);
        }
      }
    }
  } catch {
    console.warn(`⚠️  타입 "${typeName}" 생성 실패`);
  }
}

// 참조된 타입 중 schemas에 없는 것 보고
function findMissingRefs(obj: any): Set<string> {
  const missing = new Set<string>();
  if (!obj || typeof obj !== 'object') return missing;
  if (Array.isArray(obj)) {
    obj.forEach((item) => findMissingRefs(item).forEach((r) => missing.add(r)));
    return missing;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$ref' && typeof value === 'string') {
      const name = value.replace('#/components/schemas/', '');
      if (!schemas[name]) missing.add(name);
    }
    if (typeof value === 'object') {
      findMissingRefs(value).forEach((r) => missing.add(r));
    }
  }
  return missing;
}

const missingRefs = findMissingRefs(schemas);
if (missingRefs.size > 0) {
  // 누락 참조 타입 개별 생성 시도
  for (const ref of missingRefs) {
    const originalName = Object.entries(RENAME_MAP).find(([, v]) => v === ref)?.[0] || ref;
    try {
      const refSchema = generator.createSchema(originalName);
      const { $schema, definitions: defs, ...body } = refSchema;
      schemas[ref] = toOpenAPI(body);
    } catch {
      console.warn(`⚠️  참조 타입 "${ref}" 생성 실패`);
      schemas[ref] = { type: 'object' };
    }
  }
}

const outputPath = path.resolve(__dirname, '../src/swagger-schemas.json');
fs.writeFileSync(outputPath, JSON.stringify(schemas, null, 2));
console.log(`✅ ${Object.keys(schemas).length}개 스키마 생성 → ${path.relative(process.cwd(), outputPath)}`);
