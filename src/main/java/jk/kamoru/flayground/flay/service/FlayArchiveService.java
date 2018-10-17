package jk.kamoru.flayground.flay.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jk.kamoru.flayground.flay.domain.Flay;

public interface FlayArchiveService {

	Flay get(String opus);

	Page<Flay> page(Pageable pageable, String keyword);

}