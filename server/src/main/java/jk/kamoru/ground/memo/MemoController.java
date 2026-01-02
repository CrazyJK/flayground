package jk.kamoru.ground.memo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jk.kamoru.ground.Ground;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Memo")
@RestController
@RequestMapping(Ground.API_PREFIX + "/memo")
public class MemoController {

  @Autowired
  MemoService memoService;

  @Operation(summary = "메모 읽기")
  @GetMapping
  public Memo read() {
    return memoService.read();
  }

  @Operation(summary = "메모 저장")
  @PostMapping
  public Memo postMethodName(@RequestParam String html) {
    return memoService.write(html);
  }

}
