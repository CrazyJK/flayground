package jk.kamoru.ground.todayis;

import java.io.File;
import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jk.kamoru.ground.stream.MovieStreamHandler;
import jk.kamoru.ground.todayis.domain.Todayis;
import jk.kamoru.ground.todayis.service.TodayisService;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Todayis")
@RestController
@RequestMapping("/todayis")
public class TodayisController {

  @Autowired
  TodayisService todayisService;

  @Autowired
  MovieStreamHandler movieStreamHandler;

  @GetMapping
  public Collection<Todayis> getList() {
    return todayisService.list();
  }

  @PatchMapping("/play")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void play(@RequestBody Todayis todayis) {
    todayisService.play(todayis);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@RequestBody Todayis todayis) {
    todayisService.delete(todayis);
  }

  @Operation(summary = "파일 스트리밍")
  @GetMapping("/stream/{uuid}")
  public void stream(@PathVariable String uuid, HttpServletRequest request, HttpServletResponse response) {
    Todayis todayis = todayisService.get(uuid);
    movieStreamHandler.streamFile(request, response, new File(todayis.getFilePath()));
  }

}
