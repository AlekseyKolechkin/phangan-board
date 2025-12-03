package com.bulletinboard.service;

import com.bulletinboard.domain.Ad;
import com.bulletinboard.domain.AdImage;
import com.bulletinboard.dto.AdImageResponse;
import com.bulletinboard.exception.ResourceNotFoundException;
import com.bulletinboard.repository.AdImageRepository;
import com.bulletinboard.repository.AdRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AdImageService {

    @Value("${app.upload-dir}")
    private String uploadDir;
    private final AdRepository adRepository;
    private final AdImageRepository adImageRepository;

    public AdImageService(AdRepository adRepository, AdImageRepository adImageRepository) {
        this.adRepository = adRepository;
        this.adImageRepository = adImageRepository;
    }

    public List<AdImageResponse> uploadImages(Long adId, List<MultipartFile> files, String editToken) {
        Ad ad = adRepository.findById(adId)
                .orElseThrow(() -> new ResourceNotFoundException("Ad", adId));

        if (!ad.getEditToken().equals(editToken)) {
            throw new RuntimeException("Invalid edit token");
        }

        List<AdImageResponse> responses = new ArrayList<>();

        int position = 0;
        for (MultipartFile file : files) {
            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + extension;
            saveFile(adId, file, filename);
            AdImage savedImage = persistAdImage(adId, filename, position++);
            responses.add(new AdImageResponse(savedImage.getId(), savedImage.getUrl(), savedImage.getPosition()));
        }

        return responses;
    }

    private AdImage persistAdImage(Long adId, String filename, int position) {
        AdImage image = new AdImage();
        image.setAdId(adId);
        image.setUrl("/uploads/" + adId + "/" + filename);
        image.setPosition(position);

        return adImageRepository.save(image);
    }

    private void saveFile(Long adId, MultipartFile file, String filename) {
        try {
            Path rootDir = Paths.get(uploadDir);
            Path adFolder = rootDir.resolve(adId.toString());
            Files.createDirectories(adFolder);

            Path destination = adFolder.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot == -1 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase();
    }
}
