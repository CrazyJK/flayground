package jk.kamoru.ground.flay;

import java.io.File;
import java.util.Collection;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.ground.Ground;
import jk.kamoru.ground.flay.service.CandidatesProvider;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Candidates")
@RestController
@RequestMapping(Ground.API_PREFIX + "/flays/candidates")
public class CandidatesController {

  @Autowired
  CandidatesProvider candidatesProvider;

  @GetMapping
  public Collection<File> list(@RequestParam(required = false) String keyword) {
    if (keyword != null && !keyword.isEmpty()) {
      return candidatesProvider.find().stream().filter(f -> StringUtils.containsIgnoreCase(f.getName(), keyword)).toList();
    }
    return candidatesProvider.find();
  }

}
