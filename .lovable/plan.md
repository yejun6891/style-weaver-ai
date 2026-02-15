

# accessoryStylePrompt.js 수정 계획

## 문제
AI가 셀러브리티의 키를 잘못된 수치로 언급하는 현상 (할루시네이션)

## 수정 내용
`buildKoreanPrompt`와 `buildEnglishPrompt` 함수의 "중요 규칙" 섹션에 아래 규칙을 추가합니다.

### 한국어 프롬프트 (buildKoreanPrompt)
기존 규칙 8개 뒤에 추가:

```
9. celebrityMatch에서 셀러브리티를 선택할 때, 사용자가 입력한 키와 실제로 비슷한 키를 가진 셀러브리티를 매칭하세요
10. 셀러브리티의 키, 체중 등 신체 수치는 정확히 알고 있는 경우에만 언급하세요. 확실하지 않으면 수치를 언급하지 말고 스타일 유사성만 설명하세요
11. 절대로 셀러브리티의 신체 정보를 추측하거나 지어내지 마세요
```

### 영어 프롬프트 (buildEnglishPrompt)
기존 규칙 8개 뒤에 추가:

```
9. For celebrityMatch, select a celebrity whose ACTUAL height is similar to the user's height
10. Only mention a celebrity's height or body measurements if you are certain they are accurate. If unsure, omit numbers and focus on style similarity only
11. NEVER guess or fabricate celebrity physical attributes
```

### 기술 상세

`accessoryStylePrompt.js` 파일에서 두 함수의 return 문자열 끝부분을 수정합니다. 이 파일은 Render 백엔드에 배포해야 합니다.

