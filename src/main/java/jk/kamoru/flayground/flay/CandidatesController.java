package jk.kamoru.flayground.flay;

import java.io.File;
import java.util.Collection;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.service.CandidatesProvider;

@RestController
public class CandidatesController {

    @Autowired CandidatesProvider candidatesProvider;

    @GetMapping("/candidates")
    public Collection<File> list() {
        return candidatesProvider.find();
    }

    @GetMapping("/candidates/{keyword}")
    public Collection<File> find(@PathVariable String keyword) {
        return candidatesProvider.find().stream()
                .filter(f -> StringUtils.containsIgnoreCase(f.getName(), keyword))
                .collect(Collectors.toList());
    }

}
