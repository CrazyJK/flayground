package jk.kamoru.ground.diary;

import java.util.Collection;
import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.diary.Diary.Meta;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Diary")
@RestController
@RequestMapping(Ground.API_PREFIX + "/diary")
public class DiaryController {

  @Autowired
  DiaryService diaryService;

  @GetMapping
  public Collection<Diary> list() {
    return diaryService.list();
  }

  @GetMapping("/dates")
  public Set<String> dates() {
    return diaryService.dates();
  }

  @GetMapping("/meta")
  public List<Meta> metaList() {
    return diaryService.meta();
  }

  @GetMapping("/date/{date}")
  public Diary date(@PathVariable String date) {
    return diaryService.findByDate(date);
  }

  @PostMapping
  public Diary save(@RequestBody Diary diary) {
    return diaryService.save(diary);
  }

}
