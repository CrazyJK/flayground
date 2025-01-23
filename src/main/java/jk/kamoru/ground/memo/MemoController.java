package jk.kamoru.ground.memo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/memo")
public class MemoController {

  @Autowired
  MemoService memoService;

  @GetMapping
  public Memo read() {
    return memoService.read();
  }

  @PostMapping
  public Memo postMethodName(@RequestParam String html) {
    return memoService.write(html);
  }

}
